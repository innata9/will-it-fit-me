import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Body, Button, Caption, Card, Chip, Field, H1, H2, Row, Screen, Small } from '../../components/ui';
import { useStore } from '../../store';
import { colors } from '../../theme';

const ALL = 'All looks';

export default function Looks() {
  const { looks, folders, wardrobe, addFolder, moveLook, removeLook } = useStore();
  const [active, setActive] = useState(ALL);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [moving, setMoving] = useState<string | null>(null);

  const shown = active === ALL ? looks : looks.filter((l) => l.folder === active);
  const count = (f: string) => (f === ALL ? looks.length : looks.filter((l) => l.folder === f).length);
  const strip = (f: string) => (f === ALL ? looks : looks.filter((l) => l.folder === f))[0]?.pieces.map((p) => p.colorHex).slice(0, 4) ?? [];

  const create = () => {
    if (addFolder(name)) {
      setActive(name.trim());
      setCreating(false);
      setName('');
    } else {
      Alert.alert('Folder name', 'Enter a new name that isn’t used yet.');
    }
  };

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', paddingTop: 8 }}>
        <H1>Looks</H1>
        <Button label="New look" icon="plus" style={{ minHeight: 44 }} onPress={() => router.push('/outfit')} />
      </Row>

      <H2>Folders</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {[ALL, ...folders].map((f) => {
          const on = f === active;
          const c = strip(f);
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => { setActive(f); setMoving(null); }}
              style={{ width: '48%', backgroundColor: colors.surface, borderRadius: 16, borderWidth: on ? 2 : 1, borderColor: on ? colors.accent : colors.line, padding: 12, gap: 8 }}
            >
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={{ flex: 1, height: 26, borderRadius: 5, backgroundColor: c[i] ?? colors.lineSoft }} />
                ))}
              </View>
              <Text style={{ fontSize: 14, fontWeight: on ? '700' : '600', color: colors.ink }}>{f}</Text>
              <Caption>{count(f) === 1 ? '1 look' : `${count(f)} looks`}</Caption>
            </Pressable>
          );
        })}
        {!creating && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setCreating(true)}
            style={{ width: '48%', minHeight: 100, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A9A6B4', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Icon name="folder" color={colors.accent} />
            <Text style={{ color: colors.accent, fontWeight: '700' }}>New folder</Text>
          </Pressable>
        )}
      </View>
      {creating && (
        <Card>
          <Field label="Folder name" placeholder="For example: Wedding guest" value={name} onChangeText={setName} autoFocus onSubmitEditing={create} />
          <Row>
            <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setCreating(false)} />
            <Button label="Create" style={{ flex: 1 }} onPress={create} />
          </Row>
        </Card>
      )}

      <H2>{`${active} · ${shown.length === 1 ? '1 look' : `${shown.length} looks`}`}</H2>
      {shown.length === 0 ? <Body>No looks here yet. Build one and save it here, or move one in.</Body> : null}
      {shown.map((l) => (
        <Card key={l.id}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {l.pieces.slice(0, 5).map((p, i) => (
              <View key={i} style={{ flex: 1, height: 52, borderRadius: 10, backgroundColor: p.colorHex, borderWidth: 1, borderColor: colors.line }} />
            ))}
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>{l.name}</Text>
            <Small>{l.pieces.map((p) => p.name).join(', ')}</Small>
          </View>
          <Row gap={8}>
            <Chip label={l.folder} />
            <View style={{ flex: 1 }} />
            <Button label="Move" variant="secondary" style={{ minHeight: 44 }} onPress={() => setMoving(moving === l.id ? null : l.id)} />
            <Button label="Open" variant="dark" style={{ minHeight: 44 }} onPress={() => router.push({ pathname: '/tryon', params: { lookId: l.id } })} />
          </Row>
          {moving === l.id && (
            <View style={{ gap: 8, borderTopWidth: 1, borderColor: colors.lineSoft, paddingTop: 10 }}>
              <Text style={{ fontWeight: '700', color: colors.ink }}>Move to folder</Text>
              <Row gap={8} style={{ flexWrap: 'wrap' }}>
                {folders.filter((f) => f !== l.folder).map((f) => (
                  <Chip key={f} label={f} onPress={() => { moveLook(l.id, f); setMoving(null); }} />
                ))}
              </Row>
              <Pressable
                accessibilityRole="button"
                onPress={() => Alert.alert('Delete look?', 'This can’t be undone.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => removeLook(l.id) }])}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.bad, fontWeight: '600' }}>Delete look</Text>
              </Pressable>
            </View>
          )}
        </Card>
      ))}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="hanger" color={colors.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.ink }}>My wardrobe · {wardrobe.length} items</Text>
          <Caption>Add clothes you own so looks use them first.</Caption>
        </View>
        <Button label="Open" variant="secondary" style={{ minHeight: 44 }} onPress={() => router.push('/wardrobe')} />
      </Card>
    </Screen>
  );
}
