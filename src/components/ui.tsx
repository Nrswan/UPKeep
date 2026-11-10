import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { addDays, addMonths, formatDate, todayStr } from '../lib/due';
import { statusColors, useTheme } from '../lib/theme';
import type { DueStatus } from '../lib/types';

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const t = useTheme();
  if (!scroll) return <View style={[styles.flex, { backgroundColor: t.bg }]}>{children}</View>;
  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.pad} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.card, borderColor: t.line }, style]}>{children}</View>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.sub }]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  small,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'plain' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  small?: boolean;
}) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.primary : kind === 'danger' ? t.dangerBg : t.muted;
  const fg = kind === 'primary' ? t.onPrimary : kind === 'danger' ? t.danger : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, hint, ...input }: { label: string; hint?: string } & TextInputProps) {
  const t = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.sub }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.sub}
        accessibilityLabel={label}
        {...input}
        style={[styles.input, { color: t.text, backgroundColor: t.card, borderColor: t.line }]}
      />
      {hint ? <Text style={[styles.hint, { color: t.sub }]}>{hint}</Text> : null}
    </View>
  );
}

export function StatusPill({ status, label }: { status: DueStatus; label: string }) {
  const t = useTheme();
  const c = statusColors(t, status);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function Empty({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={t.sub} />
      <Text style={[styles.emptyTitle, { color: t.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: t.sub }]}>{body}</Text>
    </View>
  );
}

/** A small icon on a soft tint of its own color. */
export function IconBadge({
  name,
  color,
  size = 44,
}: {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: `${color}26`, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={name} size={size * 0.55} color={color} />
    </View>
  );
}

/** Picks a past date without a native date picker. Never goes past today. */
export function DateStepper({
  value,
  onChange,
  label = 'Date done',
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const t = useTheme();
  const today = todayStr();
  const clamp = (v: string) => (v > today ? today : v);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: t.sub }]}>{label}</Text>
      <Text style={[styles.dateValue, { color: t.text }]}>{value === today ? 'Today' : formatDate(value)}</Text>
      <View style={styles.row}>
        <Button small kind="plain" label="-1 year" onPress={() => onChange(addMonths(value, -12))} />
        <Button small kind="plain" label="-1 month" onPress={() => onChange(addMonths(value, -1))} />
        <Button small kind="plain" label="-1 day" onPress={() => onChange(addDays(value, -1))} />
        <Button small kind="plain" label="+1 day" disabled={value >= today} onPress={() => onChange(clamp(addDays(value, 1)))} />
        <Button small kind="plain" label="Today" disabled={value === today} onPress={() => onChange(today)} />
      </View>
    </View>
  );
}

/** Turns typed text into a positive number, or undefined when blank or invalid. */
export function toNumber(text: string): number | undefined {
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return text.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined;
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, paddingBottom: 48, gap: 12 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  section: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 8 },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { minHeight: 36, paddingHorizontal: 12, borderRadius: 10 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextSmall: { fontSize: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, fontSize: 16 },
  hint: { fontSize: 12 },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  dateValue: { fontSize: 18, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '600' },
  sub: { fontSize: 14 },
});

/**
 * Asks the user to confirm something. Uses the native alert on phones and the
 * browser's own prompt on web, where the native alert is not available.
 */
export function confirmAction(title: string, message: string, actionLabel: string, onConfirm: () => void, destructive = true) {
  if (Platform.OS === 'web') {
    const ask = (globalThis as unknown as { confirm?: (m: string) => boolean }).confirm;
    if (!ask || ask(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: actionLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
