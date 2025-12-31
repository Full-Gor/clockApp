import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, CreditCard as Edit, Trash2, Bell, Settings2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { scheduleAlarmNotification, cancelNotification, stopCurrentAlarm, triggerAlarm } from '@/services/notificationService';
import { AlarmPicker } from '@/components/AlarmPicker';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CustomAlert } from '@/components/CustomAlert';
import { GoldenClock } from '@/components/GoldenClock';
import {
  HolographicClock,
  FluidClock,
  FlapClock,
  ClockSelector,
  useClockSelection,
} from '@/components/clocks';

interface Alarm {
  id: string;
  time: string;
  days: string[];
  label: string;
  sound: string;
  enabled: boolean;
  useFadeIn?: boolean;
  fadeInDuration?: number;
  voiceMessage?: string;
  useVoiceNotification?: boolean;
  voiceLoop?: boolean;
  voiceLoopInterval?: number;
  brightnessLevel?: number;
  useBrightnessControl?: boolean;
}

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAlarmAlert, setShowAlarmAlert] = useState(false);
  const [currentAlarmLabel, setCurrentAlarmLabel] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const lastTriggerTime = useRef<number>(0);
  const [showClockSelector, setShowClockSelector] = useState(false);
  const { selectedClock, setSelectedClock, loading: clockLoading } = useClockSelection();

  // Theme colors
  const theme = {
    bg: darkMode ? ['#1a1a2e', '#16213e'] : ['#e8eef3', '#d4dde6'],
    cardBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    text: darkMode ? '#fff' : '#1a1a2e',
    subtext: darkMode ? '#9ca3af' : '#6b7280',
  };

  // Render the selected clock component
  const renderSelectedClock = () => {
    switch (selectedClock) {
      case 'holographic':
        return <HolographicClock />;
      case 'fluid':
        return <FluidClock />;
      case 'flap-dark':
        return <FlapClock theme="dark" />;
      case 'flap-light':
        return <FlapClock theme="light" />;
      case 'golden':
        return <GoldenClock />;
      case 'digital':
      default:
        return null;
    }
  };

  useEffect(() => {
    loadAlarms();
    loadDarkMode();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDarkMode = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode ?? true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du mode:', error);
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async notification => {
      if (notification.request.content.categoryIdentifier === 'alarm') {
        const now = Date.now();
        if (now - lastTriggerTime.current < 2000) {
          return;
        }
        lastTriggerTime.current = now;

        const label = notification.request.content.body || 'Alarme';
        const data = notification.request.content.data || {};

        await triggerAlarm(data);

        setCurrentAlarmLabel(label);
        setShowAlarmAlert(true);
      }
    });

    return () => subscription.remove();
  }, []);

  const loadAlarms = async () => {
    try {
      const savedAlarms = await AsyncStorage.getItem('alarms');
      if (savedAlarms) {
        setAlarms(JSON.parse(savedAlarms));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des alarmes:', error);
    }
  };

  const saveAlarms = async (newAlarms: Alarm[]) => {
    try {
      await AsyncStorage.setItem('alarms', JSON.stringify(newAlarms));
      setAlarms(newAlarms);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const addAlarm = (alarmData: Omit<Alarm, 'id'>) => {
    const newAlarm: Alarm = {
      ...alarmData,
      id: Date.now().toString(),
    };

    const newAlarms = [...alarms, newAlarm];
    saveAlarms(newAlarms);

    if (newAlarm.enabled) {
      scheduleAlarmNotification(newAlarm);
    }

    setShowModal(false);
    setEditingAlarm(null);
  };

  const updateAlarm = (alarmData: Omit<Alarm, 'id'>) => {
    if (!editingAlarm) return;

    const updatedAlarm: Alarm = {
      ...alarmData,
      id: editingAlarm.id,
    };

    const newAlarms = alarms.map(alarm =>
      alarm.id === editingAlarm.id ? updatedAlarm : alarm
    );
    saveAlarms(newAlarms);

    if (updatedAlarm.enabled) {
      scheduleAlarmNotification(updatedAlarm);
    } else {
      cancelNotification(updatedAlarm.id);
    }

    setShowModal(false);
    setEditingAlarm(null);
  };

  const toggleAlarm = (alarmId: string) => {
    const newAlarms = alarms.map(alarm => {
      if (alarm.id === alarmId) {
        const updatedAlarm = { ...alarm, enabled: !alarm.enabled };
        if (updatedAlarm.enabled) {
          scheduleAlarmNotification(updatedAlarm);
        } else {
          cancelNotification(alarmId);
        }
        return updatedAlarm;
      }
      return alarm;
    });
    saveAlarms(newAlarms);
  };

  const deleteAlarm = (alarmId: string) => {
    Alert.alert(
      'Supprimer l\'alarme',
      'Êtes-vous sûr de vouloir supprimer cette alarme ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            cancelNotification(alarmId);
            const newAlarms = alarms.filter(alarm => alarm.id !== alarmId);
            saveAlarms(newAlarms);
          },
        },
      ]
    );
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleStopAlarm = async () => {
    try {
      await stopCurrentAlarm();
      setShowAlarmAlert(false);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'alarme:', error);
    }
  };

  return (
    <LinearGradient colors={theme.bg as [string, string]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header - Neumorphic */}
        <View style={styles.headerRow}>
          <View style={{ width: 44 }} />
          <Text style={[styles.pageTitle, { color: theme.text }]}>Accueil</Text>
          <TouchableOpacity
            style={[styles.clockSelectorButton, { backgroundColor: theme.cardBg }]}
            onPress={() => setShowClockSelector(true)}
          >
            <LinearGradient
              colors={['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.1)']}
              style={styles.selectorButtonGradient}
            >
              <Settings2 size={20} color="#8b5cf6" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Clock Display - Neumorphic Card */}
        {selectedClock !== 'digital' ? (
          <View style={[styles.clockCard, { backgroundColor: theme.cardBg }]}>
            <View style={styles.clockGloss} />
            {renderSelectedClock()}
          </View>
        ) : (
          <View style={[styles.digitalClockCard, { backgroundColor: theme.cardBg }]}>
            <View style={styles.clockGloss} />
            <Text style={[styles.currentTime, { color: theme.text }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.currentDate, { color: theme.subtext }]}>
              {formatDate(currentTime)}
            </Text>
          </View>
        )}

        {/* Widget Météo */}
        <WeatherWidget />

        {/* Section Alarmes - Neumorphic */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Mes Alarmes</Text>
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={() => setShowModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.addButton}
              >
                <View style={styles.addButtonGloss} />
                <Plus size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {alarms.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.cardBg }]}>
              <Bell size={50} color={theme.subtext} />
              <Text style={[styles.emptyText, { color: theme.subtext }]}>
                Aucune alarme configurée
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                Appuyez sur + pour ajouter votre première alarme
              </Text>
            </View>
          ) : (
            alarms.map(alarm => (
              <View key={alarm.id} style={[styles.alarmItem, { backgroundColor: theme.cardBg }]}>
                <View style={styles.alarmGloss} />
                <View style={styles.alarmContent}>
                  <Text style={[styles.alarmTime, { color: theme.text }]}>{alarm.time}</Text>
                  <Text style={[styles.alarmLabel, { color: theme.subtext }]}>{alarm.label}</Text>
                  <View style={styles.alarmDaysContainer}>
                    {alarm.days.length === 7 ? (
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayBadgeText}>Tous les jours</Text>
                      </View>
                    ) : (
                      alarm.days.slice(0, 3).map((day, idx) => (
                        <View key={idx} style={styles.dayBadge}>
                          <Text style={styles.dayBadgeText}>{day}</Text>
                        </View>
                      ))
                    )}
                    {alarm.days.length > 3 && alarm.days.length < 7 && (
                      <Text style={[styles.moreText, { color: theme.subtext }]}>+{alarm.days.length - 3}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.alarmActions}>
                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => toggleAlarm(alarm.id)}
                    trackColor={{ false: darkMode ? '#374151' : '#d1d5db', true: '#8b5cf6' }}
                    thumbColor={alarm.enabled ? '#fff' : '#9ca3af'}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: 'rgba(139,92,246,0.15)' }]}
                    onPress={() => {
                      setEditingAlarm(alarm);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={16} color="#8b5cf6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: 'rgba(239,68,68,0.15)' }]}
                    onPress={() => deleteAlarm(alarm.id)}
                  >
                    <Trash2 size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal d'ajout/édition d'alarme */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowModal(false);
          setEditingAlarm(null);
        }}
      >
        <AlarmPicker
          alarm={editingAlarm}
          onSave={(alarmData) => {
            if (editingAlarm) {
              updateAlarm(alarmData);
            } else {
              addAlarm(alarmData);
            }
          }}
          onCancel={() => {
            setShowModal(false);
            setEditingAlarm(null);
          }}
        />
      </Modal>

      {/* Modal de sélection d'horloge */}
      <ClockSelector
        visible={showClockSelector}
        onClose={() => setShowClockSelector(false)}
        selectedClock={selectedClock}
        onSelect={setSelectedClock}
      />

      {/* Alerte d'alarme déclenchée */}
      <CustomAlert
        visible={showAlarmAlert}
        title="⏰ Alarme !"
        message={currentAlarmLabel}
        icon="alarm"
        showStopButton={true}
        onStop={handleStopAlarm}
        onDismiss={handleStopAlarm}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  clockSelectorButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Clock Cards - Neumorphic
  clockCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  digitalClockCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  clockGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  currentTime: {
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -3,
  },
  currentDate: {
    fontSize: 16,
    marginTop: 8,
    textTransform: 'capitalize',
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  addButtonContainer: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addButtonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Alarm Items - Neumorphic
  alarmItem: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  alarmGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  alarmContent: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 28,
    fontWeight: '600',
  },
  alarmLabel: {
    fontSize: 15,
    marginTop: 2,
  },
  alarmDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dayBadge: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  moreText: {
    fontSize: 12,
    marginLeft: 4,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
