import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckRow } from '../../components/CheckRow';
import { Body, Button, Caption, Card, Field, H1, H2, Notice, Row, Screen } from '../../components/ui';
import { completeness, hasMinimumProfile } from '../../lib/body';
import { pickImage } from '../../lib/pick';
import { runCheck } from '../../lib/runCheck';
import { useStore } from '../../store';
import { colors } from '../../theme';

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const checks = useStore((s) => s.checks);
  const measurements = useStore((s) => s.measurements);
  const addCheck = useStore((s) => s.addCheck);
  const pct = completeness(measurements);

  const start = (input: Parameters<typeof addCheck>[0]) => {
    if (!hasMinimumProfile(measurements)) {
      setError('Add your height, bust, waist and hips first — every check needs them.');
      return;
    }
    const newId = addCheck(input);
    void runCheck(newId);
    setUrl('');
    router.push({ pathname: '/check/[id]', params: { id: newId } });
  };

  const checkLink = () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(u)) {
      setError('Paste the full product link, starting with https://');
      return;
    }
    setError(null);
    start({ url: u });
  };

  const checkImage = async (source: 'camera' | 'library') => {
    const img = await pickImage(source);
    if (img) start({ screenshot: { base64: img.base64, mediaType: img.mediaType } });
  };

  return (
    <Screen>
      <View style={{ gap: 6, paddingTop: 8 }}>
        <Caption style={{ fontWeight: '600' }}>Will it fit me?</Caption>
        <H1>Check an item before you buy</H1>
      </View>
      <Card>
        <Field
          label="Link to the item"
          placeholder="https://…"
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            setError(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={checkLink}
        />
        {error ? <Notice text={error} tone="bad" /> : null}
        <Button label="Check it" onPress={checkLink} />
        <Row>
          <Button label="Screenshot" icon="image" variant="secondary" style={{ flex: 1, minHeight: 48 }} onPress={() => checkImage('library')} />
          <Button label="Photo" icon="camera" variant="secondary" style={{ flex: 1, minHeight: 48 }} onPress={() => checkImage('camera')} />
        </Row>
        <Caption>A screenshot of the product page with its size chart works for any shop.</Caption>
      </Card>

      {pct < 100 && (
        <Card tone="accent" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>Your profile is {pct}% complete</Text>
            <Caption>More measurements = more precise verdicts (calf for boots, inseam for trousers).</Caption>
          </View>
          <Pressable accessibilityRole="link" onPress={() => router.push('/(tabs)/profile')} style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Complete</Text>
          </Pressable>
        </Card>
      )}

      <H2>Recent checks</H2>
      {checks.length === 0 ? (
        <Body>Your checks will appear here.</Body>
      ) : (
        <View style={{ gap: 10 }}>
          {checks.slice(0, 10).map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </View>
      )}
    </Screen>
  );
}
