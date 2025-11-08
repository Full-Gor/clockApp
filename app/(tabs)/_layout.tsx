import { Tabs } from 'expo-router';
import { Clock, AlarmClock as Alarm, Timer, Watch as Stopwatch, Dumbbell } from 'lucide-react-native';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
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
          title: 'Alarmes',
          tabBarIcon: ({ size, color }) => (
            <Alarm size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="world-clock"
        options={{
          title: 'Horloge',
          tabBarIcon: ({ size, color }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stopwatch"
        options={{
          title: 'Chrono',
          tabBarIcon: ({ size, color }) => (
            <Stopwatch size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          title: 'Minuteur',
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