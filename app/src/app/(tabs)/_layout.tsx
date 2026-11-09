import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../components/Icon';
import { colors } from '../../theme';

const icon =
  (name: IconName) =>
  ({ color }: { color: unknown }) => <Icon name={name} color={typeof color === 'string' ? color : colors.subtle} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: { borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Check', tabBarIcon: icon('search') }} />
      <Tabs.Screen name="wishlist" options={{ title: 'Wishlist', tabBarIcon: icon('heart') }} />
      <Tabs.Screen name="looks" options={{ title: 'Looks', tabBarIcon: icon('hanger') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
