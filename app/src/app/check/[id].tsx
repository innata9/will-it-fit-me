import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Linking, Pressable, Text, View } from 'react-native';
import { Badge, Body, Button, Caption, Card, H1, H2, IconButton, Notice, Row, Screen, Small, TopBar } from '../../components/ui';
import { paletteFit } from '../../lib/color';
import { runCheck } from '../../lib/runCheck';
import { useStore } from '../../store';
import { colors, ratingStyle, verdictStyle } from '../../theme';

const AXIS_LABEL = { size: 'Size', cut: 'Cut and proportions', color: 'Color', fabric: 'Fabric' } as const;

export default function CheckScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const check = useStore((s) => s.checks.find((c) => c.id === id));
  const colorType = useStore((s) => s.colorType);
  const toggleWish = useStore((s) => s.toggleWish);
  const updateCheck = useStore((s) => s.updateCheck);

  if (!check) {
    return (
      <Screen>
        <TopBar />
        <H1>Check not found</H1>
      </Screen>
    );
  }

  const wishButton = (
    <IconButton
      icon={check.wished ? 'heartFill' : 'heart'}
      color={check.wished ? colors.accent : colors.ink}
      label={check.wished ? 'Remove from wishlist' : 'Add to wishlist'}
      onPress={() => toggleWish(check.id)}
    />
  );

  if (check.status === 'pending') {
    return (
      <Screen>
        <TopBar title="Item check" />
        <View style={{ alignItems: 'center', gap: 16, paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <H2>Checking this item against your profile…</H2>
          <Small style={{ textAlign: 'center' }}>Reading the size chart, fabric and model photos. Usually 20–40 seconds.</Small>
        </View>
      </Screen>
    );
  }

  if (check.status === 'error' || !check.result) {
    return (
      <Screen>
        <TopBar title="Item check" />
        <Notice text={check.error ?? 'Something went wrong.'} tone="bad" />
        {check.url || check.screenshot ? <Button label="Try again" onPress={() => runCheck(check.id)} /> : null}
        <Button label="Back to home" variant="secondary" onPress={() => router.replace('/(tabs)')} />
      </Screen>
    );
  }

  const { item, verdict, sizeMatch } = check.result;
  const vs = verdictStyle[verdict.verdict];
  const fit = paletteFit(item.colorHex, colorType);

  return (
    <Screen>
      <TopBar title="Item check" right={wishButton} />
      <Row gap={14} style={{ alignItems: 'center' }}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: 88, height: 112, borderRadius: 12 }} accessibilityLabel={item.name} />
        ) : (
          <View style={{ width: 88, height: 112, borderRadius: 12, backgroundColor: item.colorHex ?? colors.line }} />
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <H1 style={{ fontSize: 20, lineHeight: 25 }}>{item.name}</H1>
          <Small>{[item.brand, item.store].filter(Boolean).join(' · ')}</Small>
          {item.price ? (
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>
              {item.price}
              {item.oldPrice ? <Text style={{ color: colors.subtle, textDecorationLine: 'line-through', fontWeight: '400' }}>  {item.oldPrice}</Text> : null}
            </Text>
          ) : null}
        </View>
      </Row>

      <View style={{ backgroundColor: vs.bg, borderRadius: 20, padding: 18, gap: 10 }}>
        <Text style={{ fontSize: 19, fontWeight: '700', color: vs.ink }} accessibilityRole="header">{verdict.headline}</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.ink2 }}>{verdict.sizeReason}</Text>
        {sizeMatch?.borderline ? (
          <Text style={{ fontSize: 13, color: colors.ink2 }}>
            Size {sizeMatch.borderline.size} is close: only the {sizeMatch.borderline.measure} is {sizeMatch.borderline.overCm} cm over.
          </Text>
        ) : null}
        <Text style={{ fontSize: 13, color: colors.ink2 }}>
          <Text style={{ fontWeight: '700' }}>Confidence: {verdict.confidence}</Text> — {verdict.confidenceReason}
        </Text>
      </View>

      <Card style={{ paddingVertical: 6, gap: 0 }}>
        {verdict.axes.map((a, i) => {
          const r = ratingStyle[a.rating];
          return (
            <View key={a.axis} style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderTopWidth: i ? 1 : 0, borderColor: colors.lineSoft }}>
              <View style={{ width: 88 }}>
                <Badge label={r.label} ink={r.ink} bg={r.bg} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{AXIS_LABEL[a.axis]}</Text>
                <Small>{a.text}</Small>
                {a.axis === 'color' && item.colorHex ? (
                  <Row gap={8}>
                    <View style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: item.colorHex }} />
                    <Caption>
                      {item.colorName ?? 'Item color'} · {fit === 'in' ? 'in your palette' : fit === 'neutral' ? 'a neutral for you' : fit === 'avoid' ? 'keep away from your face' : 'not in your palette'}
                    </Caption>
                  </Row>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>

      <Card>
        <H2>What could go wrong</H2>
        <Body>{verdict.risks}</Body>
        <H2>How to make it work</H2>
        <Body>{verdict.howTo}</Body>
        {item.returns ? (
          <>
            <H2>Returns</H2>
            <Body>{item.returns}</Body>
          </>
        ) : null}
        {verdict.missing.length ? <Caption>Missing data: {verdict.missing.join(', ')}</Caption> : null}
      </Card>

      {item.url ? <Button label="Open in store" onPress={() => Linking.openURL(item.url!)} /> : null}
      <Button label="Complete the look" variant="soft" onPress={() => router.push({ pathname: '/outfit', params: { checkId: check.id } })} />
      <Button label="I bought it — tell us how it fits" variant="secondary" onPress={() => router.push({ pathname: '/fit/[id]', params: { id: check.id } })} />

      <Row style={{ justifyContent: 'space-between' }}>
        <Body>Was this verdict helpful?</Body>
        {check.helpful == null ? (
          <Row gap={8}>
            {[true, false].map((v) => (
              <Pressable
                key={String(v)}
                accessibilityRole="button"
                onPress={() => updateCheck(check.id, { helpful: v })}
                style={{ minHeight: 44, minWidth: 64, borderRadius: 12, borderWidth: 1, borderColor: colors.field, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontWeight: '600', color: colors.ink }}>{v ? 'Yes' : 'No'}</Text>
              </Pressable>
            ))}
          </Row>
        ) : (
          <Text style={{ fontWeight: '700', color: colors.good }}>Thanks!</Text>
        )}
      </Row>
    </Screen>
  );
}
