import * as MediaLibrary from 'expo-media-library/legacy';
import * as FileSystem from 'expo-file-system/legacy';

export interface VideoMetadata {
  id: string;
  tripId: string;
  filePath: string;
  duration: number;
  fileSize: number;
  startTime: Date;
  endTime: Date;
  cameraType: 'back' | 'front';
  cloudUrl?: string; // Kept for compatibility but not used
}

const VIDEOS_FILE = `${FileSystem.documentDirectory}delroad_videos.json`;

class CameraServiceClass {
  // Read all videos from local storage
  private async readVideos(): Promise<VideoMetadata[]> {
    try {
      const info = await FileSystem.getInfoAsync(VIDEOS_FILE);
      if (!info.exists) return [];
      const content = await FileSystem.readAsStringAsync(VIDEOS_FILE);
      const data = JSON.parse(content);
      // Convert string dates back to Date objects
      return data.map((v: any) => ({
        ...v,
        startTime: new Date(v.startTime),
        endTime: new Date(v.endTime),
      }));
    } catch (e) {
      console.error('Failed to read videos file', e);
      return [];
    }
  }

  // Write all videos to local storage
  private async writeVideos(videos: VideoMetadata[]): Promise<void> {
    try {
      await FileSystem.writeAsStringAsync(VIDEOS_FILE, JSON.stringify(videos));
    } catch (e) {
      console.error('Failed to write videos file', e);
    }
  }

  // Request all required permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      return mediaLibraryPermission.status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Save recorded video to device gallery and local database
  async saveRecording(
    videoUri: string,
    tripId: string,
    cameraType: 'back' | 'front' = 'back'
  ): Promise<VideoMetadata | null> {
    try {
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(videoUri);
      
      // Get duration from file (approximate from file size)
      // Note: For accurate duration, you'd need to use expo-av to load the video
      const approximateDuration = Math.floor((fileInfo.size || 0) / (150 * 1024)); // ~150KB per second for 1080p

      const startTime = new Date(Date.now() - (approximateDuration * 1000));
      const endTime = new Date();

      const metadata: VideoMetadata = {
        id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        tripId,
        filePath: asset.uri,
        duration: approximateDuration,
        fileSize: fileInfo.size || 0,
        startTime,
        endTime,
        cameraType,
      };

      // Save to local database
      const videos = await this.readVideos();
      videos.push(metadata);
      await this.writeVideos(videos);

      // Clean up temp file if different from asset URI
      if (videoUri !== asset.uri) {
        try {
          await FileSystem.deleteAsync(videoUri, { idempotent: true });
        } catch (e) {
          console.warn('Could not delete temp video file:', e);
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error saving recording:', error);
      return null;
    }
  }

  // Get videos for a specific trip
  async getVideosForTrip(tripId: string): Promise<VideoMetadata[]> {
    try {
      const videos = await this.readVideos();
      return videos
        .filter((v) => v.tripId === tripId)
        .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (error) {
      console.error('Error in getVideosForTrip:', error);
      return [];
    }
  }

  // Delete a video (file and local database record)
  async deleteVideo(videoId: string): Promise<boolean> {
    try {
      let videos = await this.readVideos();
      const video = videos.find((v) => v.id === videoId);

      if (!video) {
        console.error('Video not found in local database');
        return false;
      }

      // Delete file from device if it exists
      try {
        const fileInfo = await FileSystem.getInfoAsync(video.filePath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(video.filePath, { idempotent: true });
        }
      } catch (e) {
        console.warn('Could not delete video file:', e);
      }

      // Remove from database
      videos = videos.filter((v) => v.id !== videoId);
      await this.writeVideos(videos);

      return true;
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      return false;
    }
  }

  // Cleanup old videos (older than specified days)
  async cleanupOldVideos(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let videos = await this.readVideos();
      const oldVideos = videos.filter((v) => v.startTime < cutoffDate);

      if (oldVideos.length === 0) {
        return 0;
      }

      // Delete files from device
      for (const video of oldVideos) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(video.filePath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(video.filePath, { idempotent: true });
          }
        } catch (e) {
          console.warn('Could not delete old video file:', e);
        }
      }

      // Remove from database
      videos = videos.filter((v) => v.startTime >= cutoffDate);
      await this.writeVideos(videos);

      console.log(`Cleaned up ${oldVideos.length} old videos`);
      return oldVideos.length;
    } catch (error) {
      console.error('Error in cleanupOldVideos:', error);
      return 0;
    }
  }

  // Get total storage usage
  async getStorageUsage(): Promise<{ totalSizeBytes: number; videoCount: number; totalSizeMB: number }> {
    try {
      const videos = await this.readVideos();
      const totalSizeBytes = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0);
      const videoCount = videos.length;
      const totalSizeMB = totalSizeBytes / (1024 * 1024);

      return { totalSizeBytes, videoCount, totalSizeMB };
    } catch (error) {
      console.error('Error in getStorageUsage:', error);
      return { totalSizeBytes: 0, videoCount: 0, totalSizeMB: 0 };
    }
  }

  // Check if storage limit exceeded
  async isStorageLimitExceeded(limitMB: number = 10000): Promise<boolean> {
    const { totalSizeMB } = await this.getStorageUsage();
    return totalSizeMB >= limitMB;
  }

  // Sync video to cloud storage (Disabled as per user request for local only)
  async syncVideoToCloud(videoId: string): Promise<{ success: boolean; cloudUrl?: string }> {
    console.warn('Cloud sync is disabled. Videos are stored locally only.');
    return { success: false };
  }

  // Sync all unsynced videos to cloud (Disabled as per user request for local only)
  async syncAllVideosToCloud(): Promise<{ synced: number; failed: number; skipped: number }> {
    console.warn('Cloud sync is disabled. Videos are stored locally only.');
    return { synced: 0, failed: 0, skipped: 0 };
  }
}

export const CameraService = new CameraServiceClass();
