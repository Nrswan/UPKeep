import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';

import { useTheme } from '../../lib/theme';
import { useDueItems } from '../../lib/useDue';

export default function TabsLayout() {
  const t = useTheme();
  const overdue = useDueItems().filter((i) => i.due.status === 'overdue').length;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: t.bg },
        headerTintColor: t.text,
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 24, fontWeight: '800' },
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.sub,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.line },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Due',
          tabBarBadge: overdue > 0 ? overdue : undefined,
          tabBarIcon: ({ focused, size }) => <Ionicons name="checkbox-outline" color={focused ? t.primary : t.sub} size={size} />,
        }}
      />
      <Tabs.Screen
        name="assets"
        options={{
          title: 'My stuff',
          tabBarIcon: ({ focused, size }) => <Ionicons name="home-outline" color={focused ? t.primary : t.sub} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, size }) => <Ionicons name="settings-outline" color={focused ? t.primary : t.sub} size={size} />,
        }}
      />
    </Tabs>
  );
}
