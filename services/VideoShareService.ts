import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert, Linking, Platform } from 'react-native';

export type ShareFormat = '9:16' | '1:1' | '4:5' | '16:9' | 'original';
export type ShareTarget = 'instagram_stories' | 'instagram_feed' | 'general';

export interface ShareOptions {
  videoUri: string;
  target: ShareTarget;
  format?: ShareFormat;
  speedOverlay?: boolean;
  mimeType?: string;
}

class VideoShareServiceClass {
  // Check if Instagram is installed
  async isInstagramInstalled(): Promise<boolean> {
    try {
      const instagramUrl = Platform.OS === 'ios'
        ? 'instagram://'
        : 'com.instagram.android';
      
      if (Platform.OS === 'ios') {
        return await Linking.canOpenURL(instagramUrl);
      } else {
        return await Linking.canOpenURL(`market://details?id=${instagramUrl}`);
      }
    } catch {
      return false;
    }
  }

  // Share video to Instagram Stories
  async shareToInstagramStories(videoUri: string): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Use Instagram's custom URL scheme
        const instagramUrl = `instagram-stories://share?source_video_path=${encodeURIComponent(videoUri)}`;
        
        const canOpen = await Linking.canOpenURL('instagram-stories://');
        if (canOpen) {
          await Linking.openURL(instagramUrl);
          return true;
        } else {
          Alert.alert(
            'Instagram Not Found',
            'Please install Instagram to share to Stories',
            [{ text: 'OK' }]
          );
          return false;
        }
      } else {
        // Android: Share via standard sharing intent
        // Instagram will appear in the share sheet if installed
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
          return false;
        }

        await Sharing.shareAsync(videoUri, {
          mimeType: 'video/mp4',
          dialogTitle: 'Share to Instagram Stories',
          UTI: 'public.movie',
        });
        return true;
      }
    } catch (error) {
      console.error('Error sharing to Instagram Stories:', error);
      Alert.alert('Share Error', 'Could not share to Instagram Stories');
      return false;
    }
  }

  // Share video to Instagram Feed  
  async shareToInstagramFeed(videoUri: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
        return false;
      }

      await Sharing.shareAsync(videoUri, {
        mimeType: 'video/mp4',
        dialogTitle: 'Share to Instagram',
        UTI: 'public.movie',
      });
      return true;
    } catch (error) {
      console.error('Error sharing to Instagram Feed:', error);
      Alert.alert('Share Error', 'Could not share to Instagram Feed');
      return false;
    }
  }

  // General share (system sheet)
  async shareGeneral(videoUri: string, title?: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Not Available', 'Sharing is not available on this device');
        return false;
      }

      await Sharing.shareAsync(videoUri, {
        mimeType: 'video/mp4',
        dialogTitle: title || 'Share Video',
        UTI: 'public.movie',
      });
      return true;
    } catch (error) {
      console.error('Error sharing video:', error);
      Alert.alert('Share Error', 'Could not share video');
      return false;
    }
  }

  // Share with format selection
  async shareWithOptions(options: ShareOptions): Promise<boolean> {
    const { videoUri, target } = options;

    // Check file exists
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      Alert.alert('File Not Found', 'Video file could not be found');
      return false;
    }

    switch (target) {
      case 'instagram_stories':
        return this.shareToInstagramStories(videoUri);
      case 'instagram_feed':
        return this.shareToInstagramFeed(videoUri);
      case 'general':
      default:
        return this.shareGeneral(videoUri);
    }
  }

  // Show share picker dialog
  showSharePicker(
    videoUri: string,
    onShare: (success: boolean) => void
  ): void {
    Alert.alert(
      'Share Video',
      'Choose where to share your dashcam video:',
      [
        {
          text: '📸 Instagram Stories',
          onPress: async () => {
            const success = await this.shareToInstagramStories(videoUri);
            onShare(success);
          },
        },
        {
          text: '📰 Instagram Feed',
          onPress: async () => {
            const success = await this.shareToInstagramFeed(videoUri);
            onShare(success);
          },
        },
        {
          text: '🔗 Share (Other Apps)',
          onPress: async () => {
            const success = await this.shareGeneral(videoUri);
            onShare(success);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => onShare(false),
        },
      ]
    );
  }
}

export const VideoShareService = new VideoShareServiceClass();
