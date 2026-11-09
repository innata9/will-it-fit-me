import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useStore } from '../store';
import { colors } from '../theme';

/** Waits for saved data to load, then opens onboarding or the app. */
export default function Index() {
  const [ready, setReady] = useState(useStore.persist.hasHydrated());
  const onboarded = useStore((s) => s.onboarded);

  useEffect(() => {
    if (ready) return;
    return useStore.persist.onFinishHydration(() => setReady(true));
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  return <Redirect href={onboarded ? '/(tabs)' : '/welcome'} />;
}
