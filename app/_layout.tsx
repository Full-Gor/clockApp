import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeNotifications } from '@/services/notificationService';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AIActionsProvider } from '@/contexts/AIActionsContext';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <LanguageProvider>
      <AIActionsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </AIActionsProvider>
    </LanguageProvider>
  );
}