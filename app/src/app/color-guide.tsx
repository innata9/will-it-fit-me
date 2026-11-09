import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Body, Button, Caption, Card, H1, H2, Row, Screen, Small, Swatch, TopBar } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

export default function ColorGuide() {
  const ct = useStore((s) => s.colorType);
  if (!ct) {
    return (
      <Screen>
        <TopBar title="Color guide" />
        <H1>Find your color type first</H1>
        <Button label="Take a selfie" onPress={() => router.push('/selfie')} />
      </Screen>
    );
  }
  const g = ct.guide;
  return (
    <Screen>
      <TopBar title="Color guide" />
      <View style={{ backgroundColor: '#3E2A1F', borderRadius: 24, padding: 20, gap: 10 }}>
        <Text style={{ color: '#E9D3C6', fontSize: 13, fontWeight: '600' }}>Your season</Text>
        <Text style={{ color: '#FBF5EE', fontSize: 26, fontWeight: '700' }} accessibilityRole="header">{ct.season}</Text>
        <Text style={{ color: '#F1E6D2', fontSize: 14, lineHeight: 20 }}>{ct.summary}</Text>
        <Row gap={6}>
          {ct.best.slice(0, 6).map((c) => (
            <View key={c.hex} style={{ flex: 1, height: 30, borderRadius: 6, backgroundColor: c.hex }} />
          ))}
        </Row>
      </View>

      <Card>
        <H2>Combinations that work on you</H2>
        <Small>Put the first color near your face, the rest lower down.</Small>
        {g.combos.map((c) => (
          <Row key={c.name} gap={12} style={{ borderTopWidth: 1, borderColor: colors.lineSoft, paddingTop: 12 }}>
            <Row gap={0}>
              {c.colors.slice(0, 3).map((h, i) => (
                <View key={h + i} style={{ width: 30, height: 44, backgroundColor: h, borderTopLeftRadius: i === 0 ? 8 : 0, borderBottomLeftRadius: i === 0 ? 8 : 0, borderTopRightRadius: i === 2 ? 8 : 0, borderBottomRightRadius: i === 2 ? 8 : 0 }} />
              ))}
            </Row>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: '700', fontSize: 14, color: colors.ink }}>{c.name}</Text>
              <Caption>{c.idea}</Caption>
            </View>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>Swap your basics</H2>
        {g.swaps.map((s) => (
          <Row key={s.from} gap={10}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.fromHex, borderWidth: 1, borderColor: colors.field }} />
            <Small style={{ width: 70 }}>{s.from}</Small>
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <Icon name="back" size={16} color="#8A8794" />
            </View>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.toHex, borderWidth: 1, borderColor: colors.line }} />
            <Text style={{ fontWeight: '700', color: colors.ink, flex: 1 }}>{s.to}</Text>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>Metals and accessories</H2>
        <Body>{ct.metals.join(', ')}. {g.metalsTip}</Body>
      </Card>

      <Card>
        <H2>Prints and fabrics</H2>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {g.textures.map((t) => (
            <View key={t} style={{ backgroundColor: '#F6F1EA', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: '#4A3200', fontSize: 13, fontWeight: '600' }}>{t}</Text>
            </View>
          ))}
        </Row>
        <Small>{g.texturesTip}</Small>
      </Card>

      <Card>
        <H2>Makeup and hair</H2>
        {g.beauty.map((b) => (
          <Row key={b.area} gap={12}>
            <Row gap={4}>
              {b.colors.slice(0, 2).map((h) => (
                <Swatch key={h} hex={h} size={20} rounded={10} />
              ))}
            </Row>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', fontSize: 13, color: colors.ink }}>{b.area}</Text>
              <Caption>{b.tip}</Caption>
            </View>
          </Row>
        ))}
      </Card>

      <Card>
        <H2>Keep away from your face</H2>
        <Small>Love one of these? Wear it as trousers, shoes or a bag, with a palette color on top.</Small>
        <Row gap={10}>
          {ct.avoid.map((a) => (
            <View key={a.hex} style={{ flex: 1, gap: 4 }}>
              <View style={{ height: 40, borderRadius: 10, backgroundColor: a.hex, borderWidth: 1, borderColor: colors.line }} />
              <Caption>{a.name}</Caption>
            </View>
          ))}
        </Row>
      </Card>
      <Button label="Build a look in my colors" onPress={() => router.push('/outfit')} />
    </Screen>
  );
}
