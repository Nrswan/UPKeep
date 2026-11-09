import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { photoUri } from '../lib/photos';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * A colorful header block. Shows the user's photo when there is one, with a
 * dark fade so the white text stays readable. Otherwise shows a gradient with
 * a large faded icon.
 */
export function Banner({
  colors,
  icon,
  photo,
  title,
  subtitle,
  height = 150,
  children,
  style,
}: {
  colors: readonly [string, string, ...string[]];
  icon: IconName;
  photo?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  children?: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[local.wrap, { minHeight: height }, style]}>
      {photo ? (
        <>
          <Image source={{ uri: photoUri(photo) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
        </>
      ) : (
        <>
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <MaterialCommunityIcons name={icon} size={height * 1.05} color="rgba(255,255,255,0.14)" style={local.ghost} />
        </>
      )}
      <View style={local.body}>
        {title ? (
          <Text style={local.title} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={local.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

/** A number with a caption, for use on top of a Banner. */
export function BannerStat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={local.stat}>
      <Text style={local.statValue}>{value}</Text>
      <Text style={local.statLabel}>{label}</Text>
    </View>
  );
}

const local = StyleSheet.create({
  wrap: { borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  ghost: { position: 'absolute', right: -18, bottom: -22 },
  body: { padding: 16, gap: 4 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 15 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600' },
});
