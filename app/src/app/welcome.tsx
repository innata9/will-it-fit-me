import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Avatar } from '../components/Avatar';
import { Body, Button, Caption, H1, Screen } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

export default function Welcome() {
  const hasProfile = useStore((s) => s.measurements.heightCm != null);
  return (
    <Screen edges={['top', 'bottom']} contentStyle={{ paddingTop: 32 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent, letterSpacing: 0.5 }}>WILL IT FIT ME?</Text>
      <H1 style={{ fontSize: 28, lineHeight: 34 }}>Know before you buy</H1>
      <Body>Paste a link from any shop. We check size, cut and color against your body and your color type — and show it on you.</Body>
      <View style={{ backgroundColor: colors.stage, borderRadius: 24, alignItems: 'center', paddingTop: 16 }}>
        <Avatar width={160} look={{ baseLayer: true }} />
      </View>
      <Button label="Get started" onPress={() => router.push('/onboarding')} />
      {hasProfile ? (
        <Button
          label="Continue with my profile"
          variant="secondary"
          onPress={() => {
            useStore.getState().finishOnboarding();
            router.replace('/(tabs)');
          }}
        />
      ) : null}
      <Caption style={{ textAlign: 'center' }}>Your measurements stay on this phone. Your selfie is analysed once and never stored.</Caption>
    </Screen>
  );
}
