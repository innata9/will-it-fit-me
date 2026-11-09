import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge, Body, Button, Caption, Card, H1, H2, Notice, Row, Screen, Small, Swatch } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';
import type { Swatch as SwatchT } from '../types';

export default function ColorTypeScreen() {
  const ct = useStore((s) => s.colorType);
  const onboarded = useStore((s) => s.onboarded);
  const finish = useStore((s) => s.finishOnboarding);

  if (!ct) {
    return (
      <Screen>
        <H1>No color type yet</H1>
        <Button label="Take a selfie" onPress={() => router.replace('/selfie')} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Caption>Your season</Caption>
      <H1 style={{ fontSize: 28 }}>{ct.season}</H1>
      <Badge label="Detected automatically from your selfie" ink={colors.accentDark} bg={colors.accentSoft} />
      <Body>{ct.summary}</Body>
      <Row style={{ flexWrap: 'wrap' }} gap={8}>
        {[`Undertone: ${ct.undertone}`, `Contrast: ${ct.contrast}`, `${cap(ct.chroma)} colors`, `Metal: ${ct.metals.join(', ')}`].map((t) => (
          <View key={t} style={{ backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>{t}</Text>
          </View>
        ))}
      </Row>
      <Card>
        <H2>What we detected</H2>
        <Row gap={10}>
          {[['Skin', ct.skin], ['Hair', ct.hair], ['Eyes', ct.eyes]].map(([label, v]) => {
            const val = v as { hex: string; label: string };
            return (
              <View key={label as string} style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 40, borderRadius: 10, backgroundColor: val.hex }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>{label as string}</Text>
                <Caption>{val.label}</Caption>
              </View>
            );
          })}
        </Row>
      </Card>
      <Palette title="Your best colors" items={ct.best} />
      <Palette title="Core neutrals" items={ct.neutrals} />
      <Palette title="Best kept away from your face" items={ct.avoid} />
      <Notice text={`Confidence: ${ct.confidence}. ${ct.confidenceNote}`} tone={ct.confidence === 'high' ? 'good' : 'warn'} />
      <Button label="See my color guide" variant="soft" onPress={() => router.push('/color-guide')} />
      <Button label="Retake selfie" variant="secondary" onPress={() => router.push('/selfie')} />
      <Button
        label={onboarded ? 'Done' : 'Save and finish'}
        onPress={() => {
          finish();
          router.replace('/(tabs)');
        }}
      />
    </Screen>
  );
}

function Palette({ title, items }: { title: string; items: SwatchT[] }) {
  return (
    <Card>
      <H2>{title}</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {items.map((c) => (
          <View key={c.hex + c.name} style={{ width: '22%', gap: 4 }}>
            <Swatch hex={c.hex} size="100%" rounded={10} bordered />
            <Small style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>{c.name}</Small>
            <Caption style={{ fontSize: 11 }}>{c.hex}</Caption>
          </View>
        ))}
      </View>
    </Card>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
