import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { type BackupData, buildBackup, type ParsedBackup, parseBackup, photoNames } from './backup';
import { todayStr } from './due';

/**
 * Everything that reads or writes files outside the app: backups and PDF
 * reports. The pure parts live in backup.ts and report.ts so they can be tested.
 */
const native = Platform.OS === 'ios' || Platform.OS === 'android';

function photoDir(): Directory {
  return new Directory(Paths.document, 'photos');
}

/** Saves text as a file in the browser. Used only on web. */
function downloadOnWeb(name: string, text: string, type: string) {
  const g = globalThis as unknown as {
    document: { createElement: (t: string) => { href: string; download: string; click: () => void } };
    URL: { createObjectURL: (b: Blob) => string; revokeObjectURL: (u: string) => void };
  };
  const url = g.URL.createObjectURL(new Blob([text], { type }));
  const a = g.document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => g.URL.revokeObjectURL(url), 1000);
}

/**
 * Writes a backup file and opens the share sheet so the user can save it to
 * Files, iCloud Drive or Google Drive, or send it to themselves.
 * Resolves to how many photos were included.
 */
export async function exportBackup(data: BackupData, includePhotos: boolean): Promise<{ photos: number; missing: number }> {
  const photos: Record<string, string> = {};
  let missing = 0;
  if (native && includePhotos) {
    for (const name of photoNames(data)) {
      try {
        const file = new File(photoDir(), name);
        if (file.exists) photos[name] = await file.base64();
        else missing++;
      } catch {
        missing++;
      }
    }
  }
  const text = buildBackup(data, photos, new Date().toISOString());
  const name = `upkeep-backup-${todayStr()}.json`;

  if (!native) {
    downloadOnWeb(name, text, 'application/json');
    return { photos: 0, missing: 0 };
  }

  const out = new File(Paths.cache, name);
  if (out.exists) await out.delete();
  out.create();
  await out.write(text);
  await Sharing.shareAsync(out.uri, { mimeType: 'application/json', dialogTitle: 'Save your Upkeep backup', UTI: 'public.json' });
  return { photos: Object.keys(photos).length, missing };
}

/** Lets the user pick a backup file and reads it. Resolves to null if they cancel. Throws a user-ready Error on a bad file. */
export async function pickBackup(): Promise<ParsedBackup | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.length) return null;
  const asset = picked.assets[0];
  let text: string;
  try {
    text = native ? await new File(asset.uri).text() : await (asset.file ? asset.file.text() : (await fetch(asset.uri)).text());
  } catch {
    throw new Error('Could not read that file.');
  }
  return parseBackup(text);
}

/** Puts the photos from a backup back into the app's photo folder. */
export async function restorePhotos(photos: Record<string, string>): Promise<void> {
  if (!native) return;
  const dir = photoDir();
  if (!dir.exists) await dir.create({ intermediates: true, idempotent: true });
  for (const [name, content] of Object.entries(photos)) {
    try {
      const file = new File(dir, name);
      if (file.exists) await file.delete();
      file.create();
      await file.write(content, { encoding: 'base64' });
    } catch {
      // One bad photo should not stop the rest of the restore.
    }
  }
}

/** Turns a report page into a PDF and opens the share sheet. On web it opens the page to print. */
export async function shareReport(html: string, title: string): Promise<void> {
  if (!native) {
    const g = globalThis as unknown as { open: (u?: string) => { document: { write: (h: string) => void; close: () => void } } | null };
    const win = g.open('');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  // Give the file a readable name before sharing it.
  const safe = title.replace(/[^\w -]+/g, '').trim().replace(/\s+/g, '-') || 'upkeep';
  const named = new File(Paths.cache, `${safe}-record-${todayStr()}.pdf`);
  try {
    if (named.exists) await named.delete();
    await new File(uri).copy(named);
    await Sharing.shareAsync(named.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Share maintenance record' });
  } catch {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
