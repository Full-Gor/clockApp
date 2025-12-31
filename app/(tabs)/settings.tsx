import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGES, Language } from '@/services/i18n';

interface SettingsState {
  darkMode: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  alarmVolume: number;
  timerVolume: number;
  selectedCategory: string;
}

const CATEGORIES = [
  { id: 'health', label: 'Santé', color: '#00d4aa', gradient: ['#00d4aa', '#00b894'] },
  { id: 'work', label: 'Travail', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'] },
  { id: 'sport', label: 'Sport', color: '#ff6b6b', gradient: ['#ff6b6b', '#ee5a5a'] },
  { id: 'personal', label: 'Perso', color: '#ff85a2', gradient: ['#ff85a2', '#ff6b8a'] },
];

export default function SettingsScreen() {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: true,
    notificationsEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    alarmVolume: 80,
    timerVolume: 70,
    selectedCategory: 'work',
  });

  const [activeAlarms, setActiveAlarms] = useState(0);
  const [completedRounds, setCompletedRounds] = useState(0);

  // Animation for sun glow
  const sunGlowAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadSettings();
    loadStats();

    // Pulsing animation for sun icon
    if (!settings.darkMode) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sunGlowAnim, {
            toValue: 1.3,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sunGlowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [settings.darkMode]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_settings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadStats = async () => {
    try {
      const alarms = await AsyncStorage.getItem('alarms');
      if (alarms) {
        const parsedAlarms = JSON.parse(alarms);
        const active = parsedAlarms.filter((a: any) => a.enabled).length;
        setActiveAlarms(active);
      }

      const rounds = await AsyncStorage.getItem('completed_rounds');
      if (rounds) {
        setCompletedRounds(parseInt(rounds, 10));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveSettings = async (newSettings: SettingsState) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const isDark = settings.darkMode;
  const bgColors = isDark ? ['#1a1a2e', '#16213e'] : ['#e8eef3', '#d4dde6'];
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)';
  const textColor = isDark ? '#fff' : '#1a1a2e';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  // Neumorphic shadows for light mode
  const neumorphicLight = {
    shadowColor: '#ffffff',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  };

  const neumorphicDark = {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  };

  return (
    <LinearGradient colors={bgColors} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>{t('settings')}</Text>
        </View>

        {/* Dark Mode Toggle Section */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.darkModeContainer}>
            <View style={styles.darkModeIcons}>
              <Animated.View style={[
                styles.iconContainer,
                !isDark && styles.iconActive,
                { transform: [{ scale: !isDark ? sunGlowAnim : 1 }] }
              ]}>
                <Text style={styles.iconText}>☀️</Text>
              </Animated.View>

              <TouchableOpacity
                style={[
                  styles.toggleTrack,
                  { backgroundColor: isDark ? '#8b5cf6' : '#d1d5db' }
                ]}
                onPress={() => updateSetting('darkMode', !isDark)}
                activeOpacity={0.8}
              >
                <Animated.View style={[
                  styles.toggleThumb,
                  {
                    transform: [{ translateX: isDark ? 40 : 0 }],
                    backgroundColor: '#fff',
                  }
                ]} />
              </TouchableOpacity>

              <View style={[styles.iconContainer, isDark && styles.iconActive]}>
                <Text style={styles.iconText}>🌙</Text>
              </View>
            </View>

            <View style={styles.darkModeLabels}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  !isDark && styles.modeButtonActive,
                  { backgroundColor: !isDark ? 'rgba(139,92,246,0.2)' : 'transparent' }
                ]}
                onPress={() => updateSetting('darkMode', false)}
              >
                <Text style={[styles.modeButtonText, { color: !isDark ? '#8b5cf6' : subtextColor }]}>
                  Light Mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  isDark && styles.modeButtonActive,
                  { backgroundColor: isDark ? 'rgba(139,92,246,0.2)' : 'transparent' }
                ]}
                onPress={() => updateSetting('darkMode', true)}
              >
                <Text style={[styles.modeButtonText, { color: isDark ? '#8b5cf6' : subtextColor }]}>
                  OFF
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category Pills */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Catégories</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => updateSetting('selectedCategory', cat.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  style={[
                    styles.categoryPill,
                    settings.selectedCategory === cat.id && styles.categoryPillActive,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.categoryGloss} />
                  <Text style={styles.categoryText}>{cat.label}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statsLabel, { color: subtextColor }]}>Émotion</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#00d4aa', '#8b5cf6']}
                  style={[styles.progressFill, { width: '75%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[styles.progressValue, { color: textColor }]}>150%</Text>
            </View>
            <View style={styles.statsFooter}>
              <Text style={[styles.statsFooterLabel, { color: subtextColor }]}>Brønning</Text>
              <Text style={[styles.statsFooterLabel, { color: subtextColor }]}>Teshine</Text>
            </View>
            <View style={styles.statsFooter}>
              <Text style={[styles.statsFooterValue, { color: textColor }]}>Ropørtins</Text>
              <Text style={[styles.statsFooterValue, { color: textColor }]}>Atralts</Text>
            </View>
          </View>

          <View style={[styles.statsCard, { backgroundColor: cardBg }]}>
            <Text style={[styles.statsLabel, { color: subtextColor }]}>Sxprration</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#ff6b6b', '#ff85a2']}
                  style={[styles.progressFill, { width: '60%' }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={[styles.progressValue, { color: textColor }]}>120%</Text>
            </View>
            <View style={styles.statsFooter}>
              <Text style={[styles.statsFooterLabel, { color: subtextColor }]}>Roonning</Text>
              <Text style={[styles.statsFooterLabel, { color: subtextColor }]}>Tesone</Text>
            </View>
            <View style={styles.statsFooter}>
              <Text style={[styles.statsFooterValue, { color: textColor }]}>Enpestins</Text>
              <Text style={[styles.statsFooterValue, { color: textColor }]}>Extarts</Text>
            </View>
          </View>
        </View>

        {/* Real Stats */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Statistiques</Text>
          <View style={styles.realStatsRow}>
            <View style={styles.realStatItem}>
              <Text style={[styles.realStatValue, { color: '#8b5cf6' }]}>{activeAlarms}</Text>
              <Text style={[styles.realStatLabel, { color: subtextColor }]}>Alarmes actives</Text>
            </View>
            <View style={styles.realStatDivider} />
            <View style={styles.realStatItem}>
              <Text style={[styles.realStatValue, { color: '#00d4aa' }]}>{completedRounds}</Text>
              <Text style={[styles.realStatLabel, { color: subtextColor }]}>Rounds complétés</Text>
            </View>
          </View>
        </View>

        {/* Volume Sliders */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Volume</Text>

          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: subtextColor }]}>Alarmes</Text>
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={settings.alarmVolume}
                onValueChange={(value) => updateSetting('alarmVolume', value)}
                minimumTrackTintColor="#8b5cf6"
                maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                thumbTintColor="#8b5cf6"
              />
              <Text style={[styles.sliderValue, { color: textColor }]}>
                {Math.round(settings.alarmVolume)}%
              </Text>
            </View>
          </View>

          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: subtextColor }]}>Minuteur</Text>
            <View style={styles.sliderRow}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={settings.timerVolume}
                onValueChange={(value) => updateSetting('timerVolume', value)}
                minimumTrackTintColor="#00d4aa"
                maximumTrackTintColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                thumbTintColor="#00d4aa"
              />
              <Text style={[styles.sliderValue, { color: textColor }]}>
                {Math.round(settings.timerVolume)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle Switches */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Notifications</Text>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: textColor }]}>Notifications</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => updateSetting('notificationsEnabled', value)}
              trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#8b5cf6' }}
              thumbColor={settings.notificationsEnabled ? '#fff' : '#9ca3af'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: textColor }]}>Sons</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={(value) => updateSetting('soundEnabled', value)}
              trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#8b5cf6' }}
              thumbColor={settings.soundEnabled ? '#fff' : '#9ca3af'}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: textColor }]}>Vibrations</Text>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={(value) => updateSetting('vibrationEnabled', value)}
              trackColor={{ false: isDark ? '#374151' : '#d1d5db', true: '#8b5cf6' }}
              thumbColor={settings.vibrationEnabled ? '#fff' : '#9ca3af'}
            />
          </View>
        </View>

        {/* Language Selector */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>{t('language')}</Text>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  {
                    backgroundColor: language === lang.code
                      ? 'rgba(139,92,246,0.3)'
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                    borderColor: language === lang.code ? '#8b5cf6' : 'transparent',
                  }
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  { color: language === lang.code ? '#8b5cf6' : textColor }
                ]}>
                  {lang.nativeName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={[styles.card, { backgroundColor: cardBg, marginBottom: 40 }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>À propos</Text>
          <Text style={[styles.appVersion, { color: subtextColor }]}>
            ClockApp v1.0.0
          </Text>
          <Text style={[styles.appCopyright, { color: subtextColor }]}>
            © 2024 ClockApp. Tous droits réservés.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    // Neumorphic effect simulation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Dark Mode Toggle
  darkModeContainer: {
    alignItems: 'center',
  },
  darkModeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconActive: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  iconText: {
    fontSize: 24,
  },
  toggleTrack: {
    width: 80,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 16,
    padding: 4,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  darkModeLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeButtonActive: {
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Category Pills
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  categoryPill: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 90,
    alignItems: 'center',
    overflow: 'hidden',
    // 3D effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  categoryPillActive: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  categoryGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  categoryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Stats Cards
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    // Glow effect
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'right',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statsFooterLabel: {
    fontSize: 11,
  },
  statsFooterValue: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Real Stats
  realStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  realStatValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  realStatLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  realStatDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Volume Sliders
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
    textAlign: 'right',
  },

  // Toggle Switches
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  toggleLabel: {
    fontSize: 16,
  },

  // Language Selector
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
  },

  // App Info
  appVersion: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    textAlign: 'center',
  },
});
