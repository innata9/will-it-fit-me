import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Body, Button, Card, H1, Notice, Screen, Swatch } from '../components/ui';
import { api } from '../lib/api';
import { useStore } from '../store';
import { colors } from '../theme';
import type { ColorTypeResult } from '../types';

const STEPS = [
  'Checking photo quality',
  'Correcting for light color',
  'Reading skin undertone',
  'Reading hair and eye color',
  'Measuring contrast',
  'Matching to 12 seasons',
];

export default function Analyzing() {
  const selfie = useStore((s) => s.pendingSelfie);
  const setColorType = useStore((s) => s.setColorType);
  const setPendingSelfie = useStore((s) => s.setPendingSelfie);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<ColorTypeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!selfie || started.current) return;
    started.current = true;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1400);
    api
      .colorType({ base64: selfie.base64, mediaType: selfie.mediaType })
      .then((r) => {
        setStep(STEPS.length);
        setResult(r);
        if (r.quality.ok) {
          setColorType(r);
          setPendingSelfie(null);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => clearInterval(timer));
    return () => clearInterval(timer);
  }, [selfie, setColorType, setPendingSelfie]);

  if (!selfie && !result) {
    return (
      <Screen>
        <H1>No selfie yet</H1>
        <Button label="Take a selfie" onPress={() => router.replace('/selfie')} />
      </Screen>
    );
  }

  const done = (i: number) => i < step;
  const finding = (i: number) => {
    if (!result) return null;
    if (i === 2) return { text: result.skin.label, hex: [result.skin.hex] };
    if (i === 3) return { text: `${result.hair.label} hair, ${result.eyes.label} eyes`, hex: [result.hair.hex, result.eyes.hex] };
    if (i === 4) return { text: `${result.contrast} contrast`, hex: [] };
    if (i === 5) return { text: result.season, hex: result.best.slice(0, 3).map((b) => b.hex) };
    return null;
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <H1>Reading your colors</H1>
      {selfie?.uri ? (
        <Image source={{ uri: selfie.uri }} style={{ height: 200, borderRadius: 20 }} resizeMode="cover" accessibilityLabel="Your selfie" />
      ) : null}
      <Card style={{ paddingVertical: 8 }}>
        {STEPS.map((label, i) => {
          const f = finding(i);
          return (
            <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i < STEPS.length - 1 ? 1 : 0, borderColor: colors.lineSoft }}>
              {done(i) ? (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.good, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={14} color="#FFF" strokeWidth={3} />
                </View>
              ) : i === step && !error ? (
                <ActivityIndicator color={colors.accent} style={{ width: 24 }} />
              ) : (
                <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.field }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: done(i) || i === step ? colors.ink : '#8A8794' }}>{label}</Text>
                {f && done(i) ? <Text style={{ fontSize: 12, color: colors.subtle }}>{f.text}</Text> : null}
              </View>
              {f && done(i) ? f.hex.map((h) => <Swatch key={h} hex={h} size={18} rounded={5} />) : null}
            </View>
          );
        })}
      </Card>

      {error ? (
        <>
          <Notice text={error} tone="bad" />
          <Button label="Try again" onPress={() => router.replace('/selfie')} />
        </>
      ) : result && !result.quality.ok ? (
        <>
          <Notice text={`This photo is hard to read: ${result.quality.issues.join(' ')}`} />
          <Button label="Retake selfie" onPress={() => router.replace('/selfie')} />
          <Button
            label="Use this result anyway"
            variant="secondary"
            onPress={() => {
              setColorType(result);
              setPendingSelfie(null);
              router.replace('/colortype');
            }}
          />
        </>
      ) : result ? (
        <Button label="See my color type" onPress={() => router.replace('/colortype')} />
      ) : (
        <Body style={{ textAlign: 'center' }}>Usually takes 10–20 seconds</Body>
      )}
    </Screen>
  );
}
