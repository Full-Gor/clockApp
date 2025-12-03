import { Tabs, usePathname } from 'expo-router';
import { Clock, AlarmClock as Alarm, Timer, Watch as Stopwatch, Dumbbell } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIBubble } from '@/components/AIBubble';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const [bubbleKey, setBubbleKey] = useState(0);
  const { language, t } = useLanguage();

  // Réinitialiser la bulle à chaque changement de page
  useEffect(() => {
    setBubbleKey(prev => prev + 1);
  }, [pathname]);

  return (
    <View style={{ flex: 1 }}>
      <AIBubble key={bubbleKey} language={language} />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + insets.bottom,
          paddingBottom: Platform.OS === 'android' ? 8 : insets.bottom,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('alarms'),
          tabBarIcon: ({ size, color }) => (
            <Alarm size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="world-clock"
        options={{
          title: t('worldClock'),
          tabBarIcon: ({ size, color }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stopwatch"
        options={{
          title: t('stopwatch'),
          tabBarIcon: ({ size, color }) => (
            <Stopwatch size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: t('timer'),
          tabBarIcon: ({ size, color }) => (
            <Timer size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rounds"
        options={{
          title: 'Rounds',
          tabBarIcon: ({ size, color }) => (
            <Dumbbell size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#1f1f2e',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 2,
  },
});
