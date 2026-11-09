import { Text, View } from 'react-native';
import { Body, Caption, Card, H1, H2, Screen, Small, TopBar } from '../components/ui';
import { MEASURE_STEPS } from '../lib/body';
import { colors } from '../theme';

const TIPS = [
  'Use a soft tape measure, not a metal one.',
  'Measure over thin underwear or close-fitting clothes.',
  'Keep the tape level all the way around — check in a mirror.',
  'Snug, not tight: one finger should slide under the tape.',
  'Stand straight and relaxed, feet together, looking ahead.',
  'Measure twice. If the numbers differ, use the average.',
];

export default function MeasureGuide() {
  return (
    <Screen>
      <TopBar title="Measuring guide" />
      <H1>How to measure yourself</H1>
      <Body>About 10 minutes. Accurate measurements are what make every verdict reliable.</Body>
      <Card>
        <H2>Before you start</H2>
        {TIPS.map((t) => (
          <Body key={t}>•  {t}</Body>
        ))}
      </Card>
      {MEASURE_STEPS.map((s, i) => (
        <Card key={s.key} style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>{i + 1}</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{s.title}</Text>
            <Small style={{ color: colors.ink2 }}>{s.how}</Small>
            <Caption>{s.why}</Caption>
          </View>
        </Card>
      ))}
      <Card tone="accent">
        <H2>No tape measure?</H2>
        <Small style={{ color: colors.ink2 }}>
          Lay a garment that fits you well flat and measure it: waistband edge to edge (×2 for the full waist), length, inseam.
          Brand size charts often list garment measurements, so they can be compared directly.
        </Small>
      </Card>
    </Screen>
  );
}
