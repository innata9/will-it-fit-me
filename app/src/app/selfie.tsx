import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Button, Screen, TopBar } from '../components/ui';
import { pickImage } from '../lib/pick';
import { useStore } from '../store';

const LIGHT = '#F4F3F6';
const MUTED = '#B8B5C2';

const CHECKS = [
  'Face a window in daylight — no direct sun, no lamps',
  'No makeup, no filters, glasses off',
  'Plain white or grey top; hair and neck visible',
];

export default function Selfie() {
  const setPendingSelfie = useStore((s) => s.setPendingSelfie);
  const [busy, setBusy] = useState(false);

  const take = async (source: 'camera' | 'library') => {
    setBusy(true);
    try {
      const img = await pickImage(source, { front: true });
      if (img) {
        setPendingSelfie(img);
        router.push('/analyzing');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen dark edges={['top', 'bottom']}>
      <TopBar dark title="Color type" />
      <Text style={{ color: LIGHT, fontSize: 22, fontWeight: '700', lineHeight: 28 }} accessibilityRole="header">
        Take a selfie — we’ll find your color type
      </Text>
      <View style={{ height: 300, borderRadius: 24, backgroundColor: '#2A2830', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 170, height: 230, borderRadius: 110, borderWidth: 2.5, borderColor: '#FFF', borderStyle: 'dashed' }} />
        <Text style={{ color: MUTED, fontSize: 12, marginTop: 12 }}>Fit your face in the oval</Text>
      </View>
      {CHECKS.map((c) => (
        <View key={c} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="check" size={20} color="#6FD39A" strokeWidth={2.4} />
          <Text style={{ color: LIGHT, fontSize: 14, flex: 1 }}>{c}</Text>
        </View>
      ))}
      <Button label="Take selfie" icon="camera" onPress={() => take('camera')} loading={busy} />
      <Button label="Choose from gallery" variant="dark" onPress={() => take('library')} disabled={busy} style={{ backgroundColor: '#2A2830', borderColor: '#2A2830' }} />
      <Text style={{ color: '#9C99A6', fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
        Your selfie is used only to read colors. It is sent once for analysis and never stored.
      </Text>
    </Screen>
  );
}
