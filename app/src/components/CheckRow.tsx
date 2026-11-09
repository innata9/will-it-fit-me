import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { colors, verdictStyle } from '../theme';
import type { Check } from '../types';
import { Badge } from './ui';

export function CheckRow({ check }: { check: Check }) {
  const item = check.result?.item;
  const v = check.result?.verdict;
  const title = item?.name ?? (check.url ? hostOf(check.url) : 'Screenshot');
  const meta = item
    ? [item.brand ?? item.store, v?.recommendedSize ? `size ${v.recommendedSize}` : null].filter(Boolean).join(' · ')
    : check.status === 'pending'
      ? 'Checking…'
      : check.error ?? '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/check/[id]', params: { id: check.id } })}
      style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      {item?.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={{ width: 44, height: 54, borderRadius: 8 }} accessibilityIgnoresInvertColors />
      ) : (
        <View style={{ width: 44, height: 54, borderRadius: 8, backgroundColor: item?.colorHex ?? colors.line }} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: colors.ink }}>{title}</Text>
        <Text numberOfLines={1} style={{ fontSize: 12, color: colors.subtle }}>{meta}</Text>
      </View>
      {check.status === 'pending' ? (
        <ActivityIndicator color={colors.accent} />
      ) : v ? (
        <Badge label={verdictStyle[v.verdict].label} ink={verdictStyle[v.verdict].ink} bg={verdictStyle[v.verdict].bg} />
      ) : (
        <Badge label="Failed" ink={colors.bad} bg={colors.badBg} />
      )}
    </Pressable>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
