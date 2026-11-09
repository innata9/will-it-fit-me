import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface PickedImage {
  base64: string;
  mediaType: string;
  uri: string;
}

/** Take or choose a photo and return it as base64 (kept in memory only). */
export async function pickImage(source: 'camera' | 'library', opts: { front?: boolean } = {}): Promise<PickedImage | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      source === 'camera' ? 'Camera access needed' : 'Photo access needed',
      'You can allow it in your phone’s Settings.',
    );
    return null;
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    base64: true,
    quality: 0.6,
    exif: false,
    ...(opts.front ? { cameraType: ImagePicker.CameraType.front } : {}),
  };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]?.base64) return null;
  const a = result.assets[0];
  return { base64: a.base64!, mediaType: a.mimeType ?? 'image/jpeg', uri: a.uri };
}
