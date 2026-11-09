import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Share, Text, TextInput, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Badge, Body, Caption, Card, H1, H2, Row, Screen, Small } from '../../components/ui';
import { API_URL } from '../../lib/api';
import { bodyShape, completeness, heightCategory, MEASURE_STEPS } from '../../lib/body';
import { useStore } from '../../store';
import { colors } from '../../theme';

export default function Profile() {
  const s = useStore();
  const m = s.measurements;
  const [note, setNote] = useState('');
  const shape = bodyShape(m);
  const hc = heightCategory(m.heightCm);

  const exportData = () => {
    const { measurements, notes, fitPreference, colorType, wardrobe, looks, folders, fitHistory } = useStore.getState();
    void Share.share({
      title: 'My Will it fit me? data',
      message: JSON.stringify({ measurements, notes, fitPreference, colorType, wardrobe, looks, folders, fitHistory }, null, 2),
    });
  };

  const deleteAll = () =>
    Alert.alert('Delete profile and all data?', 'Measurements, color type, checks, looks and wardrobe will be removed from this phone. This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: () => {
          s.resetAll();
          router.replace('/welcome');
        },
      },
    ]);

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between', paddingTop: 8 }}>
        <H1>My profile</H1>
        <Badge label={`${completeness(m)}%`} ink={colors.accentDark} bg={colors.accentSoft} />
      </Row>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Measurements</H2>
          <Pressable accessibilityRole="link" onPress={() => router.push('/onboarding')} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Edit all</Text>
          </Pressable>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {MEASURE_STEPS.map((st) => {
            const v = m[st.key];
            return (
              <Pressable
                key={st.key}
                accessibilityRole="button"
                accessibilityLabel={`${st.title}: ${v ?? 'not set'}. Edit`}
                onPress={() => router.push({ pathname: '/onboarding', params: { only: st.key } })}
                style={{
                  width: '48%',
                  borderRadius: 12,
                  padding: 10,
                  gap: 2,
                  backgroundColor: v != null ? '#F6F5F8' : 'transparent',
                  borderWidth: v != null ? 0 : 1,
                  borderStyle: 'dashed',
                  borderColor: '#A9A6B4',
                }}
              >
                <Caption>{st.title}</Caption>
                {v != null ? (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{v} {st.unit}</Text>
                ) : (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accent }}>Add</Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <Pressable accessibilityRole="link" onPress={() => router.push('/measure-guide')} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 44 }}>
          <Icon name="tape" size={18} color={colors.accent} />
          <Text style={{ color: colors.accent, fontWeight: '700' }}>How to measure yourself</Text>
        </Pressable>
      </Card>

      <Card>
        <H2>Body shape and fit notes</H2>
        <Body>
          {shape ? `Body shape: ${shape}` : 'Add bust, waist and hips to see your body shape'}
          {hc ? ` · height: ${hc}${m.heightCm ? ` (${m.heightCm} cm)` : ''}` : ''}
        </Body>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {s.notes.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`${n}. Remove`}
              onPress={() => s.setNotes(s.notes.filter((x) => x !== n))}
              style={{ backgroundColor: '#F6F5F8', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>{n}  ×</Text>
            </Pressable>
          ))}
        </Row>
        <TextInput
          accessibilityLabel="Add a fit note"
          placeholder="Add a note, e.g. “Short torso” or “Boots rarely zip up”"
          placeholderTextColor="#8A8794"
          value={note}
          onChangeText={setNote}
          onSubmitEditing={() => {
            if (note.trim()) s.setNotes([...s.notes, note.trim()]);
            setNote('');
          }}
          returnKeyType="done"
          style={{ borderWidth: 1, borderColor: colors.field, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, color: colors.ink }}
        />
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push(s.colorType ? '/color-guide' : '/selfie')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <H2>{s.colorType ? `Color type: ${s.colorType.season}` : 'Color type'}</H2>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>{s.colorType ? 'Color guide' : 'Take selfie'}</Text>
          </Row>
          {s.colorType ? (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {s.colorType.best.slice(0, 8).map((c) => (
                <View key={c.hex} style={{ flex: 1, height: 28, borderRadius: 6, backgroundColor: c.hex }} />
              ))}
            </View>
          ) : (
            <Small>A selfie in daylight finds the colors that suit you.</Small>
          )}
        </Card>
      </Pressable>
      {s.colorType ? (
        <Pressable accessibilityRole="link" onPress={() => router.push('/colortype')} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: colors.accent, fontWeight: '700' }}>See full palette or retake selfie</Text>
        </Pressable>
      ) : null}

      <Card style={{ gap: 4 }}>
        <H2 style={{ marginBottom: 6 }}>Fit history</H2>
        {s.fitHistory.length === 0 ? <Small>After you buy something, tell us how it fit — advice for that brand gets sharper.</Small> : null}
        {s.fitHistory.map((f) => (
          <View key={f.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderColor: colors.lineSoft, gap: 2 }}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{f.brand} · {f.item} · {f.size}</Text>
            <Small>
              {Object.entries(f.zones).map(([z, v]) => `${z} ${v === 'right' ? 'fine' : v}`).join(', ')}. {f.kept ? 'Kept it.' : 'Returned.'} {f.note}
            </Small>
          </View>
        ))}
      </Card>

      <Pressable accessibilityRole="link" onPress={exportData} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.accent, fontWeight: '600' }}>Export my data</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={deleteAll} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: colors.bad, fontWeight: '600' }}>Delete my profile and all data</Text>
      </Pressable>
      <Caption>Server: {API_URL}</Caption>
    </Screen>
  );
}
