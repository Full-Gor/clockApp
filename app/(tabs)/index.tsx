import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, CreditCard as Edit, Trash2, Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { scheduleAlarmNotification, cancelNotification, stopCurrentAlarm } from '@/services/notificationService';
import { AlarmPicker } from '@/components/AlarmPicker';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CustomAlert } from '@/components/CustomAlert';

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

  useEffect(() => {
    loadAlarms();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Écouter les notifications d'alarme
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      if (notification.request.content.categoryIdentifier === 'alarm') {
        const label = notification.request.content.body || 'Alarme';
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
    console.log('Adding alarm:', alarmData);
    const newAlarm: Alarm = {
      ...alarmData,
      id: Date.now().toString(),
    };
    
    const newAlarms = [...alarms, newAlarm];
    saveAlarms(newAlarms);
    
    if (newAlarm.enabled) {
      scheduleAlarmNotification(newAlarm);
    }
    
    // Fermer la modale et réinitialiser l'état
    setShowModal(false);
    setEditingAlarm(null);
    console.log('Modal should be closed now');
  };

  const updateAlarm = (alarmData: Omit<Alarm, 'id'>) => {
    if (!editingAlarm) return;
    
    console.log('Updating alarm:', alarmData);
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
    
    // Fermer la modale et réinitialiser l'état
    setShowModal(false);
    setEditingAlarm(null);
    console.log('Modal should be closed after update');
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
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header avec l'heure actuelle */}
        <View style={styles.header}>
          <Text style={styles.currentTime}>{formatTime(currentTime)}</Text>
          <Text style={styles.currentDate}>{formatDate(currentTime)}</Text>
        </View>

        {/* Widget Météo */}
        <WeatherWidget />

        {/* Section Alarmes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Alarmes</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
            >
              <Plus size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {alarms.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={60} color="#4b5563" />
              <Text style={styles.emptyText}>Aucune alarme configurée</Text>
              <Text style={styles.emptySubtext}>
                Appuyez sur + pour ajouter votre première alarme
              </Text>
            </View>
          ) : (
            alarms.map(alarm => (
              <View key={alarm.id} style={styles.alarmItem}>
                <View style={styles.alarmContent}>
                  <Text style={styles.alarmTime}>{alarm.time}</Text>
                  <Text style={styles.alarmLabel}>{alarm.label}</Text>
                  <Text style={styles.alarmDays}>
                    {alarm.days.length === 7 ? 'Tous les jours' : alarm.days.join(', ')}
                  </Text>
                </View>
                <View style={styles.alarmActions}>
                  <Switch
                    value={alarm.enabled}
                    onValueChange={() => toggleAlarm(alarm.id)}
                    trackColor={{ false: '#374151', true: '#8b5cf6' }}
                    thumbColor={alarm.enabled ? '#a78bfa' : '#9ca3af'}
                  />
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      setEditingAlarm(alarm);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={16} color="#8b5cf6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
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
          console.log('Modal onRequestClose called');
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
            console.log('AlarmPicker onCancel called');
            setShowModal(false);
            setEditingAlarm(null);
          }}
        />
      </Modal>

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
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  currentDate: {
    fontSize: 16,
    color: '#9ca3af',
    textTransform: 'capitalize',
    marginTop: 4,
  },
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
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  alarmItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alarmContent: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  alarmLabel: {
    fontSize: 16,
    color: '#d1d5db',
    marginTop: 2,
  },
  alarmDays: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  alarmActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
});