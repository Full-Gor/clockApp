import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeNotifications } from '@/services/notificationService';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </LanguageProvider>
  );
}