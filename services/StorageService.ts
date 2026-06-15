import * as FileSystem from 'expo-file-system';
import { supabase } from './Supabase';
import { decode } from 'base64-arraybuffer';

export interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

class StorageServiceClass {
  private readonly bucketName = 'dashcam-videos';

  // Upload video to Supabase Storage
  async uploadVideo(
    localUri: string,
    videoId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string | null> {
    try {
      // Read file as base64
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }

      const fileSize = fileInfo.size || 0;
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Generate unique filename
      const fileName = `${videoId}.mp4`;
      const filePath = `videos/${fileName}`;

      // Report initial progress
      if (onProgress) {
        onProgress({
          bytesUploaded: 0,
          totalBytes: fileSize,
          percentage: 0,
        });
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, arrayBuffer, {
          contentType: 'video/mp4',
          upsert: false,
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        throw error;
      }

      // Report completion
      if (onProgress) {
        onProgress({
          bytesUploaded: fileSize,
          totalBytes: fileSize,
          percentage: 100,
        });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadVideo:', error);
      return null;
    }
  }

  // Download video from Supabase Storage
  async downloadVideo(
    cloudUrl: string,
    localPath: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<boolean> {
    try {
      // Download file
      const downloadResult = await FileSystem.downloadAsync(
        cloudUrl,
        localPath,
        {}
      );

      if (downloadResult.status === 200) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error downloading video:', error);
      return false;
    }
  }

  // Delete video from Supabase Storage
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      const filePath = `videos/${videoId}.mp4`;
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting from Supabase Storage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      return false;
    }
  }

  // Check if video exists in cloud
  async videoExists(videoId: string): Promise<boolean> {
    try {
      const filePath = `videos/${videoId}.mp4`;
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('videos', {
          search: `${videoId}.mp4`,
        });

      if (error) {
        console.error('Error checking video existence:', error);
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error) {
      console.error('Error in videoExists:', error);
      return false;
    }
  }

  // Get storage bucket usage
  async getStorageUsage(): Promise<{ totalSize: number; fileCount: number }> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('videos');

      if (error) {
        console.error('Error getting storage usage:', error);
        return { totalSize: 0, fileCount: 0 };
      }

      const totalSize = (data || []).reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const fileCount = (data || []).length;

      return { totalSize, fileCount };
    } catch (error) {
      console.error('Error in getStorageUsage:', error);
      return { totalSize: 0, fileCount: 0 };
    }
  }

  // Sync local video to cloud
  async syncVideoToCloud(
    videoId: string,
    localUri: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; cloudUrl?: string }> {
    try {
      // Check if already exists in cloud
      const exists = await this.videoExists(videoId);
      if (exists) {
        console.log(`Video ${videoId} already exists in cloud`);
        
        // Get existing URL
        const { data } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(`videos/${videoId}.mp4`);
        
        return { success: true, cloudUrl: data.publicUrl };
      }

      // Upload to cloud
      const cloudUrl = await this.uploadVideo(localUri, videoId, onProgress);
      
      if (cloudUrl) {
        return { success: true, cloudUrl };
      }

      return { success: false };
    } catch (error) {
      console.error('Error in syncVideoToCloud:', error);
      return { success: false };
    }
  }

  // Sync all unsynced videos
  async syncAllVideos(
    videos: Array<{ id: string; localPath: string; cloudUrl?: string }>,
    onVideoProgress?: (videoId: string, progress: UploadProgress) => void
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const video of videos) {
      // Skip if already has cloud URL
      if (video.cloudUrl) {
        console.log(`Video ${video.id} already synced`);
        synced++;
        continue;
      }

      const result = await this.syncVideoToCloud(
        video.id,
        video.localPath,
        (progress) => {
          if (onVideoProgress) {
            onVideoProgress(video.id, progress);
          }
        }
      );

      if (result.success) {
        synced++;
        
        // Update database with cloud URL
        if (result.cloudUrl) {
          await this.updateVideoCloudUrl(video.id, result.cloudUrl);
        }
      } else {
        failed++;
      }
    }

    return { synced, failed };
  }

  // Update video cloud URL in database
  private async updateVideoCloudUrl(videoId: string, cloudUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ cloud_url: cloudUrl })
        .eq('id', videoId);

      if (error) {
        console.error('Error updating video cloud URL:', error);
      }
    } catch (error) {
      console.error('Error in updateVideoCloudUrl:', error);
    }
  }

  // Initialize storage bucket (run once)
  async initializeStorageBucket(): Promise<boolean> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(b => b.name === this.bucketName);
      
      if (bucketExists) {
        console.log('Dashcam videos bucket already exists');
        return true;
      }

      // Create bucket
      const { error: createError } = await supabase.storage.createBucket(this.bucketName, {
        public: false, // Private bucket, requires authentication
        fileSizeLimit: null, // No limit (as per user requirement)
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      console.log('Dashcam videos bucket created successfully');
      return true;
    } catch (error) {
      console.error('Error in initializeStorageBucket:', error);
      return false;
    }
  }
}

export const StorageService = new StorageServiceClass();
