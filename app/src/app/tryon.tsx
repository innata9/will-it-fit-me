import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { Badge, Caption, Card, Row, Screen, Segmented, Small, TopBar } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';
import type { Piece } from '../types';

/** Full-size try-on. Opened with a saved look (`lookId`) or the builder's current pieces. */
export default function TryOn() {
  const { lookId, pieces: piecesParam } = useLocalSearchParams<{ lookId?: string; pieces?: string }>();
  const look = useStore((s) => s.looks.find((l) => l.id === lookId));
  const ct = useStore((s) => s.colorType);
  const h = useStore((s) => s.measurements.heightCm);
  const [mode, setMode] = useState<'look' | 'base'>('look');

  const pieces = useMemo<Piece[]>(() => {
    if (look) return look.pieces;
    try {
      return piecesParam ? (JSON.parse(piecesParam) as Piece[]) : [];
    } catch {
      return [];
    }
  }, [look, piecesParam]);

  return (
    <Screen>
      <TopBar title={look ? `${look.name} · ${look.folder}` : 'Try-on'} />
      <Segmented value={mode} onChange={setMode} options={[{ value: 'look', label: 'In this look' }, { value: 'base', label: 'Base layer' }]} />
      <View style={{ backgroundColor: colors.stage, borderRadius: 24, alignItems: 'center', paddingVertical: 16 }}>
        <Avatar width={240} look={{ skin: ct?.skin.hex, hair: ct?.hair.hex, eyes: ct?.eyes.hex, pieces, baseLayer: mode === 'base' }} />
      </View>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Badge label={`Body from your measurements${h ? ` · ${h} cm` : ''}`} ink={colors.ink} bg={colors.surface} />
        <Badge label="Skin, hair and eyes from your selfie" ink={colors.ink} bg={colors.surface} />
      </Row>
      {look?.review ? (
        <Card>
          {look.review.checks.map((c) => (
            <Small key={c.title}>
              {c.ok ? '✓' : '!'} {c.title}: {c.text}
            </Small>
          ))}
        </Card>
      ) : null}
      <Card style={{ flexDirection: 'row', gap: 12 }}>
        <Icon name="shield" color={colors.accent} />
        <Small style={{ flex: 1, color: colors.ink2 }}>
          Your avatar is always dressed. With no outfit chosen it wears a neutral base layer. It stays on your phone and is never shared.
        </Small>
      </Card>
      <Caption>A preview of proportions and colors. Photo-realistic rendering arrives in a later version.</Caption>
    </Screen>
  );
}
