import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { setupNotifications, syncReminders } from '../lib/reminders';
import { useStore } from '../lib/store';
import { useTheme } from '../lib/theme';

setupNotifications();

export default function RootLayout() {
  const t = useTheme();
  const hydrated = useStore((s) => s.hydrated);
  const assets = useStore((s) => s.assets);
  const tasks = useStore((s) => s.tasks);
  const logs = useStore((s) => s.logs);
  const warranties = useStore((s) => s.warranties);
  const settings = useStore((s) => s.settings);

  // Reminders are rebuilt from scratch whenever saved data changes.
  useEffect(() => {
    if (hydrated) syncReminders({ assets, tasks, logs, warranties, settings });
  }, [hydrated, assets, tasks, logs, warranties, settings]);

  if (!hydrated) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: t.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="asset/new" options={{ title: 'Add a home or vehicle', presentation: 'modal' }} />
        <Stack.Screen name="asset/[id]" options={{ title: '' }} />
        <Stack.Screen name="task/new" options={{ title: 'New task', presentation: 'modal' }} />
        <Stack.Screen name="task/[id]" options={{ title: '' }} />
        <Stack.Screen name="appliance/new" options={{ title: 'Add an appliance', presentation: 'modal' }} />
        <Stack.Screen name="appliance/[id]" options={{ title: '' }} />
        <Stack.Screen name="warranty/new" options={{ title: 'Add a warranty', presentation: 'modal' }} />
        <Stack.Screen name="warranty/[id]" options={{ title: 'Warranty' }} />
      </Stack>
    </>
  );
}
