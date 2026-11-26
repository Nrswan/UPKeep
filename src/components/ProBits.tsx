import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { initials, tradeInfo } from '../lib/contacts';
import { useTheme } from '../lib/theme';

/** Star rating. With onChange it can be tapped; tapping the current rating clears it. */
export function Stars({ value = 0, onChange, size = 18 }: { value?: number; onChange?: (v: number | undefined) => void; size?: number }) {
  const t = useTheme();
  return (
    <View style={local.stars} accessibilityLabel={value ? `${value} out of 5 stars` : 'Not rated'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = <Ionicons name={n <= value ? 'star' : 'star-outline'} size={size} color={n <= value ? '#E0A100' : t.sub} />;
        return onChange ? (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} ${n === 1 ? 'star' : 'stars'}`}
            hitSlop={6}
            onPress={() => onChange(n === value ? undefined : n)}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={n}>{icon}</View>
        );
      })}
    </View>
  );
}

const PALETTE = ['#1F8A63', '#1E6FB8', '#7C3AED', '#C2410C', '#0E7490', '#B91C1C', '#4338CA', '#92400E'];

/** A round badge with the pro's initials, colored by their trade or name. */
export function Avatar({ name, trade, size = 48 }: { name: string; trade?: string; size?: number }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const color = (trade && tradeInfo(trade)?.color) || PALETTE[hash % PALETTE.length];
  return (
    <View style={[local.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[local.initials, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

export function tradeLabel(key: string): string {
  const info = tradeInfo(key);
  return info ? info.title.charAt(0).toUpperCase() + info.title.slice(1) : key;
}

const local = StyleSheet.create({
  stars: { flexDirection: 'row', gap: 4 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '800' },
});
