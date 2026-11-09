import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Chip, H1, Notice, Screen, Small, TopBar } from '../../components/ui';
import { useStore } from '../../store';
import { colors } from '../../theme';
import type { FitEntry } from '../../types';

type Zone = keyof FitEntry['zones'];
const ZONES: { key: Zone; label: string; opts: [string, string, string] }[] = [
  { key: 'bust', label: 'Bust', opts: ['Tight', 'Just right', 'Loose'] },
  { key: 'waist', label: 'Waist', opts: ['Tight', 'Just right', 'Loose'] },
  { key: 'hips', label: 'Hips', opts: ['Tight', 'Just right', 'Loose'] },
  { key: 'length', label: 'Length', opts: ['Too short', 'Just right', 'Too long'] },
];
const VALUES = ['tight', 'right', 'loose'] as const;

export default function FitFeedback() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const check = useStore((s) => s.checks.find((c) => c.id === id));
  const addFit = useStore((s) => s.addFit);
  const item = check?.result?.item;
  const [size, setSize] = useState(check?.result?.verdict.recommendedSize ?? '');
  const [zones, setZones] = useState<FitEntry['zones']>({ bust: 'right', waist: 'right', hips: 'right', length: 'right' });
  const [kept, setKept] = useState(true);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const save = () => {
    addFit({ checkId: id, brand: item?.brand ?? item?.store ?? 'Unknown brand', item: item?.name ?? 'Item', size: size || '?', zones, kept, note: note.trim() });
    setSaved(true);
  };

  return (
    <Screen>
      <TopBar title="Fit feedback" />
      <H1>How did it fit?</H1>
      <Small>{[item?.name, item?.brand].filter(Boolean).join(' · ')}. Your answer sharpens advice for this brand.</Small>
      <Card>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Size you bought</Text>
        <TextInput
          accessibilityLabel="Size you bought"
          value={size}
          onChangeText={setSize}
          autoCapitalize="characters"
          style={{ borderWidth: 1, borderColor: colors.field, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, fontSize: 16, color: colors.ink }}
        />
        {ZONES.map((z) => (
          <View key={z.key} style={{ gap: 8 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{z.label}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {z.opts.map((label, i) => (
                <View key={label} style={{ flex: 1 }}>
                  <Chip label={label} selected={zones[z.key] === VALUES[i]} onPress={() => setZones({ ...zones, [z.key]: VALUES[i] })} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Did you keep it?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Chip label="Kept it" selected={kept} onPress={() => setKept(true)} /></View>
          <View style={{ flex: 1 }}><Chip label="Returned it" selected={!kept} onPress={() => setKept(false)} /></View>
        </View>
        <TextInput
          accessibilityLabel="Comment"
          placeholder="For example: buttons don’t gape, length is perfect"
          placeholderTextColor="#8A8794"
          value={note}
          onChangeText={setNote}
          multiline
          style={{ borderWidth: 1, borderColor: colors.field, borderRadius: 12, padding: 12, minHeight: 80, fontSize: 14, color: colors.ink, textAlignVertical: 'top' }}
        />
      </Card>
      {saved ? (
        <>
          <Notice tone="good" text="Saved to your fit history. Next checks for this brand will take it into account." />
          <Button label="Back to home" onPress={() => router.replace('/(tabs)')} />
        </>
      ) : (
        <Button label="Save feedback" onPress={save} />
      )}
    </Screen>
  );
}
