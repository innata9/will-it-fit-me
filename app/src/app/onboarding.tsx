import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Body, Button, Caption, Field, H1, Notice, Row, Screen, TopBar } from '../components/ui';
import { MEASURE_STEPS } from '../lib/body';
import { useStore } from '../store';
import { colors } from '../theme';
import type { Measurements } from '../types';

/**
 * Step-by-step measurements. `?only=calfCm` edits a single value and returns.
 */
export default function Onboarding() {
  const { only } = useLocalSearchParams<{ only?: string }>();
  const steps = useMemo(
    () => (only ? MEASURE_STEPS.filter((s) => s.key === only) : MEASURE_STEPS),
    [only],
  );
  const measurements = useStore((s) => s.measurements);
  const setMeasurement = useStore((s) => s.setMeasurement);
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const [text, setText] = useState(() => valueText(measurements, step.key));
  const [error, setError] = useState<string | null>(null);

  const go = (next: number) => {
    if (next >= steps.length) {
      if (only) router.back();
      else router.push('/selfie');
      return;
    }
    setIndex(next);
    setText(valueText(measurements, steps[next].key));
    setError(null);
  };

  const save = () => {
    const n = Number(text.replace(',', '.'));
    if (!text.trim()) {
      if (step.required) return setError(`${step.title} is needed for every check.`);
      setMeasurement(step.key, undefined);
      return go(index + 1);
    }
    if (!Number.isFinite(n) || n < step.min || n > step.max) {
      return setError(`That looks unusual for ${step.title.toLowerCase()} — expected ${step.min}–${step.max} ${step.unit}. Check and try again.`);
    }
    setMeasurement(step.key, Math.round(n * 10) / 10);
    go(index + 1);
  };

  const sanity =
    step.key === 'waistCm' && measurements.bustCm && Number(text) > measurements.bustCm + 35
      ? 'Waist is much larger than bust — please double-check.'
      : null;

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={only ? 'Edit measurement' : `Step ${index + 1} of ${steps.length} · measurements`}
        right={
          !only && !step.required ? (
            <Pressable accessibilityRole="button" onPress={() => go(index + 1)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Skip</Text>
            </Pressable>
          ) : null
        }
      />
      {!only && (
        <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: steps.length, now: index + 1 }} style={{ height: 6, borderRadius: 3, backgroundColor: colors.line }}>
          <View style={{ height: 6, borderRadius: 3, width: `${((index + 1) / steps.length) * 100}%`, backgroundColor: colors.accent }} />
        </View>
      )}
      <Row gap={8}>
        <H1>{step.title}</H1>
        {!step.required && <Caption>optional</Caption>}
      </Row>
      <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 18, gap: 10 }}>
        <Row>
          <Icon name="tape" color={colors.accent} />
          <Text style={{ fontWeight: '700', color: colors.ink }}>How to measure</Text>
        </Row>
        <Body>{step.how}</Body>
        <Caption>{step.why}</Caption>
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.push('/measure-guide')} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.accent, fontWeight: '700' }}>Full measuring guide</Text>
      </Pressable>
      <Field
        label={`Your ${step.title.toLowerCase()}`}
        suffix={step.unit}
        keyboardType="decimal-pad"
        value={text}
        onChangeText={(t) => {
          setText(t);
          setError(null);
        }}
        onSubmitEditing={save}
        returnKeyType="next"
        autoFocus
      />
      {error ? <Notice text={error} tone="bad" /> : sanity ? <Notice text={sanity} /> : null}
      <Button label={only ? 'Save' : index === steps.length - 1 ? 'Next: color type' : 'Next'} onPress={save} />
      {index > 0 && <Button label="Previous" variant="secondary" onPress={() => go(index - 1)} />}
    </Screen>
  );
}

function valueText(m: Measurements, key: keyof Measurements) {
  const v = m[key];
  return v == null ? '' : String(v);
}
