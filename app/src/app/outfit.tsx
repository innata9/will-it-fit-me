import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Badge, Body, Button, Caption, Card, Chip, H1, H2, Notice, Row, Screen, Segmented, Small, TopBar } from '../components/ui';
import { api } from '../lib/api';
import { categoryToSlot, SLOT_LABEL } from '../lib/body';
import { paletteFit } from '../lib/color';
import { apiProfile, useStore } from '../store';
import { colors, ratingStyle } from '../theme';
import type { LookCheck, Piece, Slot } from '../types';

const OCCASIONS = ['Office', 'Weekend', 'Evening', 'Travel'] as const;
const FOLDER_FOR: Record<string, string> = { Office: 'Work', Weekend: 'Weekend', Evening: 'Evening', Travel: 'Vacation' };
const ORDER: Slot[] = ['dress', 'top', 'bottom', 'outerwear', 'shoes', 'bag', 'accessory'];
const NEAR_FACE: Slot[] = ['dress', 'top', 'outerwear'];

export default function OutfitBuilder() {
  const { checkId } = useLocalSearchParams<{ checkId?: string }>();
  const state = useStore();
  const { checks, wardrobe, colorType, folders, saveLook } = state;

  const anchor = useMemo<Piece | null>(() => {
    const c = checks.find((x) => x.id === checkId)?.result?.item;
    if (!c) return null;
    return { slot: categoryToSlot(c.category), name: c.name, colorHex: c.colorHex ?? '#9A9CA3', source: 'checked', refId: checkId };
  }, [checks, checkId]);

  const candidates = useMemo(() => {
    const out: Record<Slot, Piece[]> = { dress: [], top: [], bottom: [], outerwear: [], shoes: [], bag: [], accessory: [] };
    for (const w of wardrobe) out[w.slot].push({ slot: w.slot, name: w.name, colorHex: w.colorHex, source: 'wardrobe', refId: w.id });
    for (const c of checks) {
      const it = c.result?.item;
      if (!it || c.id === checkId || c.result?.verdict.verdict === 'no') continue;
      const slot = categoryToSlot(it.category);
      out[slot].push({ slot, name: it.name, colorHex: it.colorHex ?? '#9A9CA3', source: c.wished ? 'wishlist' : 'checked', refId: c.id });
    }
    return out;
  }, [wardrobe, checks, checkId]);

  const [picked, setPicked] = useState<Partial<Record<Slot, Piece>>>({});
  const [occasion, setOccasion] = useState<(typeof OCCASIONS)[number]>('Office');
  const [view, setView] = useState<'me' | 'flat'>('me');
  const [review, setReview] = useState<LookCheck | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folder, setFolder] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);

  const pieces: Piece[] = [anchor, ...ORDER.map((s) => picked[s])].filter((p): p is Piece => !!p);
  const hasDress = pieces.some((p) => p.slot === 'dress');
  const slots = ORDER.filter((s) => s !== anchor?.slot && !(hasDress && (s === 'top' || s === 'bottom')) && !(pieces.some((p) => p.slot === 'top' || p.slot === 'bottom') && s === 'dress'));

  const choose = (slot: Slot, p: Piece | undefined) => {
    setPicked((cur) => ({ ...cur, [slot]: p }));
    setReview(null);
    setSavedTo(null);
  };

  const colorNotes = pieces
    .map((p) => ({ p, fit: paletteFit(p.colorHex, colorType) }))
    .filter(({ p, fit }) => fit === 'avoid' && NEAR_FACE.includes(p.slot));

  const runReview = async () => {
    setReviewing(true);
    setError(null);
    try {
      setReview(await api.lookCheck({ pieces, occasion, profile: apiProfile(state) }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReviewing(false);
    }
  };

  const targetFolder = folder ?? FOLDER_FOR[occasion] ?? folders[0];
  const save = () => {
    saveLook({ name: anchor?.name ?? `${occasion} look`, folder: targetFolder, occasion, pieces, review: review ?? undefined });
    setSavedTo(targetFolder);
    setPicking(false);
  };

  return (
    <Screen>
      <TopBar title="Outfit builder" />
      <H1>Complete the look</H1>
      <Small>
        {anchor ? `Built around your ${anchor.name.toLowerCase()}. ` : ''}Pieces come from your wardrobe, wishlist and checked items.
      </Small>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {OCCASIONS.map((o) => (
          <Chip key={o} label={o} selected={o === occasion} onPress={() => { setOccasion(o); setReview(null); }} />
        ))}
      </Row>

      <Segmented value={view} onChange={setView} options={[{ value: 'me', label: 'On me' }, { value: 'flat', label: 'Flat lay' }]} />
      {view === 'me' ? (
        <View style={{ backgroundColor: colors.stage, borderRadius: 20, alignItems: 'center', paddingTop: 14, paddingBottom: 10, gap: 8 }}>
          <Avatar width={170} look={{ skin: colorType?.skin.hex, hair: colorType?.hair.hex, eyes: colorType?.eyes.hex, pieces }} />
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/tryon', params: { pieces: JSON.stringify(pieces) } })} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Open full view</Text>
          </Pressable>
        </View>
      ) : (
        <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {pieces.length === 0 ? <Body>Pick pieces below.</Body> : null}
          {pieces.map((p) => (
            <View key={p.slot + p.name} style={{ width: '30%', gap: 4 }}>
              <View style={{ height: 90, borderRadius: 12, backgroundColor: p.colorHex, borderWidth: 1, borderColor: colors.line }} />
              <Caption style={{ fontWeight: '700', textTransform: 'uppercase' }}>{SLOT_LABEL[p.slot]}</Caption>
              <Small numberOfLines={2} style={{ fontSize: 12, color: colors.ink }}>{p.name}</Small>
            </View>
          ))}
        </Card>
      )}

      {colorNotes.map(({ p }) => (
        <Notice key={p.name} text={`${p.name}: this color is on your “keep away from the face” list — wear it open or swap it.`} />
      ))}

      {slots.map((slot) => (
        <View key={slot} style={{ gap: 10 }}>
          <H2>{SLOT_LABEL[slot]}</H2>
          {candidates[slot].length === 0 ? (
            <Pressable accessibilityRole="link" onPress={() => router.push('/wardrobe')} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: colors.accent, fontWeight: '700' }}>Add {SLOT_LABEL[slot].toLowerCase()} to your wardrobe</Text>
            </Pressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <OptionCard label="None" hex={colors.lineSoft} source="" selected={!picked[slot]} onPress={() => choose(slot, undefined)} />
              {candidates[slot].map((p) => (
                <OptionCard
                  key={p.refId}
                  label={p.name}
                  hex={p.colorHex}
                  source={p.source === 'wardrobe' ? 'Your wardrobe' : p.source === 'wishlist' ? 'Wishlist' : 'Checked'}
                  selected={picked[slot]?.refId === p.refId}
                  onPress={() => choose(slot, p)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      ))}

      {review ? (
        <Card style={{ gap: 0, paddingVertical: 6 }}>
          <Row style={{ justifyContent: 'space-between', paddingVertical: 10 }}>
            <H2>Look check</H2>
            <Badge label={`${review.checks.filter((c) => c.ok).length} of ${review.checks.length} pass`} ink={colors.accentDark} bg={colors.accentSoft} />
          </Row>
          {review.checks.map((c) => {
            const r = ratingStyle[c.ok ? 'good' : 'watch'];
            return (
              <View key={c.title} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: colors.lineSoft }}>
                <View style={{ width: 84 }}><Badge label={r.label} ink={r.ink} bg={r.bg} /></View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }}>{c.title}</Text>
                  <Small>{c.text}</Small>
                </View>
              </View>
            );
          })}
          <Small style={{ paddingVertical: 10 }}>{review.tip}</Small>
        </Card>
      ) : (
        <Button label="Check this look" variant="soft" onPress={runReview} loading={reviewing} disabled={pieces.length < 2} />
      )}
      {error ? <Notice tone="bad" text={error} /> : null}

      {savedTo ? (
        <>
          <Notice tone="good" text={`Saved to ${savedTo}.`} />
          <Button label="Open Looks" onPress={() => router.replace('/(tabs)/looks')} />
        </>
      ) : picking ? (
        <Card>
          <H2>Save to folder</H2>
          <Caption>Suggested from the occasion you picked</Caption>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {folders.map((f) => (
              <Chip key={f} label={f} selected={f === targetFolder} onPress={() => setFolder(f)} />
            ))}
          </Row>
          <Button label={`Save to ${targetFolder}`} onPress={save} />
        </Card>
      ) : (
        <Button label="Save this look" onPress={() => setPicking(true)} disabled={pieces.length === 0} />
      )}
    </Screen>
  );
}

function OptionCard({ label, hex, source, selected, onPress }: { label: string; hex: string; source: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}${source ? `, ${source}` : ''}`}
      onPress={onPress}
      style={{ width: 112, borderRadius: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: colors.surface, padding: 8, gap: 6 }}
    >
      <View style={{ height: 64, borderRadius: 8, backgroundColor: hex, borderWidth: 1, borderColor: colors.line }} />
      <Text numberOfLines={2} style={{ fontSize: 12, fontWeight: selected ? '700' : '600', color: colors.ink }}>{label}</Text>
      {source ? <Text style={{ fontSize: 11, color: colors.subtle }}>{source}</Text> : null}
    </Pressable>
  );
}
