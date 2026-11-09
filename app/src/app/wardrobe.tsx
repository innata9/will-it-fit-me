import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Body, Button, Caption, Card, Chip, Field, H1, H2, Row, Screen, TopBar } from '../components/ui';
import { SLOT_LABEL } from '../lib/body';
import { ITEM_COLORS } from '../lib/color';
import { useStore } from '../store';
import { colors } from '../theme';
import type { Slot } from '../types';

const SLOTS = Object.keys(SLOT_LABEL) as Slot[];

export default function Wardrobe() {
  const { wardrobe, addWardrobe, removeWardrobe } = useStore();
  const [name, setName] = useState('');
  const [slot, setSlot] = useState<Slot>('top');
  const [hex, setHex] = useState(ITEM_COLORS[2].hex);

  const add = () => {
    if (!name.trim()) return Alert.alert('Name', 'Give the item a short name, e.g. “Camel trench”.');
    addWardrobe({ name: name.trim(), slot, colorHex: hex });
    setName('');
  };

  return (
    <Screen>
      <TopBar title="My wardrobe" />
      <H1>Clothes you own</H1>
      <Body>Looks use these first, so you buy less and wear more.</Body>
      <Card>
        <H2>Add an item</H2>
        <Field label="Name" placeholder="e.g. Camel trench" value={name} onChangeText={setName} />
        <Text style={{ fontWeight: '700', color: colors.ink }}>Type</Text>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {SLOTS.map((s) => (
            <Chip key={s} label={SLOT_LABEL[s]} selected={s === slot} onPress={() => setSlot(s)} />
          ))}
        </Row>
        <Text style={{ fontWeight: '700', color: colors.ink }}>Color</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ITEM_COLORS.map((c) => (
            <Pressable
              key={c.hex}
              accessibilityRole="button"
              accessibilityLabel={c.name}
              accessibilityState={{ selected: c.hex === hex }}
              onPress={() => setHex(c.hex)}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.hex, borderWidth: c.hex === hex ? 3 : 1, borderColor: c.hex === hex ? colors.accent : colors.line }}
            />
          ))}
        </View>
        <Button label="Add to wardrobe" icon="plus" onPress={add} />
      </Card>
      {SLOTS.filter((s) => wardrobe.some((w) => w.slot === s)).map((s) => (
        <Card key={s}>
          <H2>{SLOT_LABEL[s]}</H2>
          {wardrobe
            .filter((w) => w.slot === s)
            .map((w) => (
              <Row key={w.id}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: w.colorHex, borderWidth: 1, borderColor: colors.line }} />
                <Text style={{ flex: 1, color: colors.ink }}>{w.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${w.name}`} onPress={() => removeWardrobe(w.id)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}>
                  <Caption style={{ color: colors.bad, fontWeight: '600' }}>Remove</Caption>
                </Pressable>
              </Row>
            ))}
        </Card>
      ))}
    </Screen>
  );
}
