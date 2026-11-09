import { useMemo } from 'react';
import { Switch, Text, View } from 'react-native';
import { CheckRow } from '../../components/CheckRow';
import { Body, Caption, Card, H1, Screen } from '../../components/ui';
import { useStore } from '../../store';
import { colors } from '../../theme';

export default function Wishlist() {
  const checks = useStore((s) => s.checks);
  const items = useMemo(() => checks.filter((c) => c.wished), [checks]);
  const priceAlerts = useStore((s) => s.priceAlerts);
  const setPriceAlerts = useStore((s) => s.setPriceAlerts);

  return (
    <Screen>
      <H1 style={{ paddingTop: 8 }}>Wishlist</H1>
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>Price drop alerts</Text>
          <Caption>Only for items in your size</Caption>
        </View>
        <Switch
          accessibilityLabel="Price drop alerts"
          value={priceAlerts}
          onValueChange={setPriceAlerts}
          trackColor={{ true: colors.accent, false: colors.field }}
        />
      </Card>
      {items.length === 0 ? (
        <Body>Tap the heart on any verdict to save it here.</Body>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((c) => (
            <CheckRow key={c.id} check={c} />
          ))}
        </View>
      )}
    </Screen>
  );
}
