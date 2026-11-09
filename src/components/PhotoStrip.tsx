import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { addPhoto, photoUri } from '../lib/photos';
import { useTheme } from '../lib/theme';
import { Button, styles as ui } from './ui';

/** Full screen look at one photo. Tap anywhere to close. */
export function PhotoViewer({ name, onClose }: { name: string | null; onClose: () => void }) {
  return (
    <Modal visible={name != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={local.viewer} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close photo">
        {name ? <Image source={{ uri: photoUri(name) }} style={local.full} resizeMode="contain" /> : null}
      </Pressable>
    </Modal>
  );
}

/**
 * A row of photo thumbnails. With onChange it also shows camera and library
 * buttons and lets the user remove photos.
 */
export function PhotoStrip({
  photos,
  onChange,
  label = 'Photos',
  size = 84,
}: {
  photos: string[];
  onChange?: (photos: string[]) => void;
  label?: string;
  size?: number;
}) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = !!onChange;

  const add = async (source: 'camera' | 'library') => {
    if (busy) return;
    setBusy(true);
    const name = await addPhoto(source);
    setBusy(false);
    if (name) onChange?.([...photos, name]);
  };

  if (!editable && photos.length === 0) return null;

  return (
    <View style={ui.field}>
      {editable ? <Text style={[ui.label, { color: t.sub }]}>{label}</Text> : null}
      {photos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.strip}>
          {photos.map((p, i) => (
            <View key={p}>
              <Pressable accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}. Tap to enlarge`} onPress={() => setOpen(p)}>
                <Image source={{ uri: photoUri(p) }} style={[local.thumb, { width: size, height: size, backgroundColor: t.muted }]} />
              </Pressable>
              {editable ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${i + 1}`}
                  hitSlop={8}
                  onPress={() => onChange?.(photos.filter((x) => x !== p))}
                  style={[local.remove, { backgroundColor: t.card, borderColor: t.line }]}
                >
                  <Ionicons name="close" size={14} color={t.text} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
      {editable ? (
        <View style={ui.row}>
          <Button small kind="plain" icon="camera-outline" label="Take photo" disabled={busy} onPress={() => add('camera')} />
          <Button small kind="plain" icon="images-outline" label="Choose photo" disabled={busy} onPress={() => add('library')} />
        </View>
      ) : null}
      <PhotoViewer name={open} onClose={() => setOpen(null)} />
    </View>
  );
}

const local = StyleSheet.create({
  strip: { gap: 10, paddingTop: 6, paddingRight: 6 },
  thumb: { borderRadius: 10 },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '100%' },
});
