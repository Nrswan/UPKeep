import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';

import { APP_NAME } from './brand';
import { isPdf, safeFileName } from './insurance';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Photos are copied into the app's own documents folder so they survive after
 * the camera roll or cache is cleared. Only the file name is saved in app data,
 * because the full path to the documents folder can change between app updates.
 */
const native = Platform.OS === 'ios' || Platform.OS === 'android';

function photoDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

/** Turns a saved photo name into something an <Image> can load. */
export function photoUri(name: string): string {
  if (!native || name.includes(':')) return name;
  return new File(photoDir(), name).uri;
}

function blocked(what: string) {
  Alert.alert(`${what} access is off`, `Turn it on for ${APP_NAME} in your phone settings to add photos.`, [
    { text: 'Not now', style: 'cancel' },
    { text: 'Open settings', onPress: () => Linking.openSettings() },
  ]);
}

/** Opens the camera or photo library. Resolves to the saved photo name, or null if cancelled. */
export async function addPhoto(source: 'camera' | 'library'): Promise<string | null> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        blocked('Camera');
        return null;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets?.length) return null;

    const picked = result.assets[0].uri;
    if (!native) return picked;

    const dir = photoDir();
    if (!dir.exists) await dir.create({ intermediates: true, idempotent: true });
    const ext = picked.split('?')[0].split('.').pop()?.toLowerCase();
    const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${ext && ext.length <= 4 ? ext : 'jpg'}`;
    await new File(picked).copy(new File(dir, name));
    return name;
  } catch {
    Alert.alert('Could not add that photo', 'Please try again.');
    return null;
  }
}

/** Deletes saved photo files. Safe to call with names that no longer exist. */
export async function removePhotos(names: (string | undefined)[]) {
  if (!native) return;
  for (const name of names) {
    if (!name || name.includes(':')) continue;
    try {
      const file = new File(photoDir(), name);
      if (file.exists) await file.delete();
    } catch {
      // A missing file is fine. The record is being removed anyway.
    }
  }
}

/**
 * Lets the user pick a PDF or picture from Files, iCloud Drive or Google Drive
 * and copies it into the app. Resolves to the saved name, or null if cancelled.
 */
export async function addFile(): Promise<string | null> {
  try {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.length) return null;
    const asset = picked.assets[0];
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const name = safeFileName(asset.name || (asset.mimeType === 'application/pdf' ? 'file.pdf' : 'file.jpg'), id);
    // On web the picked file stays a blob link. The original name rides along after a # so it shows in the list.
    if (!native) return `${asset.uri}#${name}`;
    const dir = photoDir();
    if (!dir.exists) await dir.create({ intermediates: true, idempotent: true });
    await new File(asset.uri).copy(new File(dir, name));
    return name;
  } catch {
    Alert.alert('Could not add that file', 'Please try again.');
    return null;
  }
}

/** Opens a saved PDF in the phone's viewer, which also has share and print. */
export async function openFile(name: string) {
  if (!native) {
    const g = globalThis as unknown as { open?: (u: string) => void };
    g.open?.(name.split('#')[0]);
    return;
  }
  try {
    await Sharing.shareAsync(photoUri(name), {
      mimeType: isPdf(name) ? 'application/pdf' : 'image/jpeg',
      UTI: isPdf(name) ? 'com.adobe.pdf' : 'public.jpeg',
    });
  } catch {
    Alert.alert('Could not open that file', 'It may have been removed.');
  }
}
