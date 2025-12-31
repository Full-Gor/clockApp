import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Bell, Upload } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { soundManager, ALARM_SOUNDS } from '@/services/soundService';
import { TimerPicker } from '@/components/TimerPicker';
import { CustomAlert } from '@/components/CustomAlert';

export default function TimerScreen() {
  const insets = useSafeAreaInsets();
  const [initialTime, setInitialTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState('classic');
  const [isMuted, setIsMuted] = useState(false);
  const [soundsRefreshKey, setSoundsRefreshKey] = useState(0);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);
  const timerNotificationId = useRef<string | null>(null);
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // Theme colors
  const theme = {
    bg: darkMode ? ['#1a1a2e', '#16213e'] : ['#e8eef3', '#d4dde6'],
    cardBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    text: darkMode ? '#fff' : '#1a1a2e',
    subtext: darkMode ? '#9ca3af' : '#6b7280',
    shadowDark: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
  };

  useEffect(() => {
    loadDarkMode();
    const loadCustomSounds = async () => {
      await soundManager.initialize();
      await soundManager.loadCustomSounds();
      setSoundsRefreshKey(prev => prev + 1);
    };
    loadCustomSounds();
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
    if (showSoundPicker) {
      const refreshSounds = async () => {
        await soundManager.loadCustomSounds();
        setSoundsRefreshKey(prev => prev + 1);
      };
      refreshSounds();
    }
  }, [showSoundPicker]);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async notification => {
      if (notification.request.content.categoryIdentifier === 'timer') {
        const soundId = notification.request.content.data?.sound || 'classic';
        if (!isMuted) {
          await soundManager.playAlarmSound(soundId);
        }
        setShowCompletionAlert(true);
      }
    });
    return () => subscription.remove();
  }, [isMuted]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      endTimeRef.current = Date.now() + (timeLeft * 1000);
      scheduleTimerNotification(timeLeft);

      intervalRef.current = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

        if (remaining <= 0) {
          setTimeLeft(0);
          setIsRunning(false);
          handleTimerComplete();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        } else {
          setTimeLeft(remaining);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      cancelTimerNotification();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!isMuted) {
      try {
        await soundManager.playAlarmSound(selectedSound);
      } catch (error) {
        console.error('Erreur lors de la lecture du son:', error);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setShowCompletionAlert(true);
  };

  const handleStopAlarm = async () => {
    await soundManager.stopCurrentAlarm();
    setShowCompletionAlert(false);
  };

  const scheduleTimerNotification = async (seconds: number) => {
    try {
      await cancelTimerNotification();

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Minuteur terminé !',
          body: 'Votre minuteur est arrivé à terme.',
          sound: true,
          categoryIdentifier: 'timer',
          data: { sound: selectedSound },
        },
        trigger: { seconds: seconds },
      });

      timerNotificationId.current = notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
    }
  };

  const cancelTimerNotification = async () => {
    try {
      if (timerNotificationId.current) {
        await Notifications.cancelScheduledNotificationAsync(timerNotificationId.current);
        timerNotificationId.current = null;
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    return initialTime > 0 ? (initialTime - timeLeft) / initialTime : 0;
  };

  const handleStartPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeLeft(initialTime);
    setIsRunning(false);
  };

  const handleTimeSet = (hours: number, minutes: number, seconds: number) => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    setInitialTime(totalSeconds);
    setTimeLeft(totalSeconds);
    setIsRunning(false);
    setShowTimePicker(false);
  };

  const presetTimes = [
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '3m', seconds: 180 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '30m', seconds: 1800 },
    { label: '1h', seconds: 3600 },
  ];

  const handlePresetTime = (seconds: number) => {
    setInitialTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
  };

  const previewSound = async (soundId: string) => {
    try {
      await soundManager.previewSound(soundId);
    } catch (error) {
      console.error('Erreur lors de la preview du son:', error);
    }
  };

  const handleAddCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const defaultName = file.name.replace(/\.[^/.]+$/, '');

      try {
        const customSound = await soundManager.addCustomSound(defaultName, file.uri);
        setSelectedSound(customSound.id);
        setSoundsRefreshKey(prev => prev + 1);
        Alert.alert('Succès', `Le son "${defaultName}" a été ajouté avec succès !`);
      } catch (error) {
        console.error('Erreur lors de l\'ajout du son:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter le son personnalisé.');
      }
    } catch (error) {
      console.error('Erreur lors de la sélection du fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier audio.');
    }
  };

  const progress = getProgress();
  const circumference = 2 * Math.PI * 130;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <LinearGradient colors={theme.bg as [string, string]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Minuteur</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.cardBg }]}
              onPress={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX size={20} color={theme.subtext} />
              ) : (
                <Volume2 size={20} color="#8b5cf6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.cardBg }]}
              onPress={() => {
                setShowSoundPicker(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Bell size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Circle - Neumorphic 3D */}
        <View style={styles.circleContainer}>
          <View style={[styles.progressCircleOuter, { backgroundColor: theme.cardBg }]}>
            {/* SVG-like progress ring using views */}
            <View style={styles.progressRing}>
              <View style={[
                styles.progressTrack,
                { borderColor: darkMode ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)' }
              ]} />
              <View style={[
                styles.progressFill,
                {
                  borderColor: '#8b5cf6',
                  transform: [{ rotate: `${progress * 360 - 90}deg` }],
                }
              ]} />
            </View>

            <View style={[styles.innerCircle, { backgroundColor: theme.cardBg }]}>
              {/* Glossy overlay */}
              <View style={styles.glossOverlay} />

              <TouchableOpacity
                style={styles.timeDisplay}
                onPress={() => !isRunning && setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.timeText, { color: theme.text }]}>
                  {formatTime(timeLeft)}
                </Text>
                <Text style={[styles.timeSubtext, { color: theme.subtext }]}>
                  {isRunning ? 'En cours...' : 'Appuyez pour modifier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: timeLeft === initialTime && !isRunning ? 'rgba(107,114,128,0.3)' : '#ef4444',
              }
            ]}
            onPress={handleReset}
            disabled={timeLeft === initialTime && !isRunning}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={timeLeft === initialTime && !isRunning
                ? ['rgba(107,114,128,0.1)', 'rgba(107,114,128,0.05)']
                : ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)']}
              style={styles.buttonGradient}
            >
              <RotateCcw size={24} color={timeLeft === initialTime && !isRunning ? '#6b7280' : '#ef4444'} />
            </LinearGradient>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity
              style={styles.mainButtonContainer}
              onPress={handleStartPause}
              disabled={timeLeft === 0}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isRunning
                  ? ['#f59e0b', '#d97706']
                  : ['#10b981', '#059669']}
                style={styles.mainButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.mainButtonGloss} />
                {isRunning ? (
                  <Pause size={32} color="#fff" />
                ) : (
                  <Play size={32} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: isRunning ? 'rgba(107,114,128,0.3)' : '#8b5cf6',
              }
            ]}
            onPress={() => setShowTimePicker(true)}
            disabled={isRunning}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={isRunning
                ? ['rgba(107,114,128,0.1)', 'rgba(107,114,128,0.05)']
                : ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.1)']}
              style={styles.buttonGradient}
            >
              <Settings size={24} color={isRunning ? '#6b7280' : '#8b5cf6'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Presets - Neumorphic Pills */}
        {!isRunning && (
          <View style={[styles.presetsContainer, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.presetsTitle, { color: theme.text }]}>Durées rapides</Text>
            <View style={styles.presetsGrid}>
              {presetTimes.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handlePresetTime(preset.seconds)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={initialTime === preset.seconds
                      ? ['#8b5cf6', '#7c3aed']
                      : darkMode
                        ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
                        : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)']}
                    style={[
                      styles.presetButton,
                      initialTime === preset.seconds && styles.presetButtonActive
                    ]}
                  >
                    <View style={styles.presetGloss} />
                    <Text style={[
                      styles.presetButtonText,
                      { color: initialTime === preset.seconds ? '#fff' : theme.subtext }
                    ]}>
                      {preset.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de sélection du temps */}
      <Modal
        visible={showTimePicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <TimerPicker
          onTimeSet={handleTimeSet}
          onCancel={() => setShowTimePicker(false)}
          initialHours={Math.floor(initialTime / 3600)}
          initialMinutes={Math.floor((initialTime % 3600) / 60)}
          initialSeconds={initialTime % 60}
        />
      </Modal>

      {/* Modal de sélection du son */}
      <Modal
        visible={showSoundPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient colors={theme.bg as [string, string]} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sons d'alarme</Text>
            <View style={{ width: 60 }} />
          </View>

          <TouchableOpacity
            style={[styles.addSoundButton, { backgroundColor: theme.cardBg }]}
            onPress={handleAddCustomSound}
          >
            <Upload size={20} color="#8b5cf6" />
            <Text style={styles.addSoundButtonText}>Ajouter un fichier MP3</Text>
          </TouchableOpacity>

          <ScrollView
            style={styles.soundsList}
            contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
          >
            {ALARM_SOUNDS.map((sound) => (
              <View key={sound.id} style={styles.soundItem}>
                <TouchableOpacity
                  style={[
                    styles.soundOption,
                    { backgroundColor: theme.cardBg },
                    selectedSound === sound.id && styles.soundOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedSound(sound.id);
                    setShowSoundPicker(false);
                  }}
                >
                  <View style={styles.soundInfo}>
                    <Text style={[
                      styles.soundName,
                      { color: theme.text },
                      selectedSound === sound.id && styles.soundNameSelected
                    ]}>
                      {sound.name}
                    </Text>
                    <Text style={[styles.soundDescription, { color: theme.subtext }]}>
                      {sound.description}
                    </Text>
                  </View>

                  {selectedSound === sound.id && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.cardBg }]}
                  onPress={() => previewSound(sound.id)}
                >
                  <Volume2 size={20} color={theme.subtext} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>

      <CustomAlert
        visible={showCompletionAlert}
        title="Temps écoulé !"
        message="Votre minuteur est terminé."
        icon="timer"
        showStopButton={!isMuted}
        onStop={handleStopAlarm}
        onDismiss={() => setShowCompletionAlert(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Progress Circle
  circleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressCircleOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  progressRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  progressTrack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 130,
    borderWidth: 8,
  },
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 130,
    borderWidth: 8,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  innerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1,
  },
  timeSubtext: {
    fontSize: 14,
    marginTop: 8,
  },

  // Control Buttons
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mainButtonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Presets
  presetsContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  presetButtonActive: {
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  presetGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  addSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  addSoundButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  soundsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  soundOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  soundOptionSelected: {
    borderColor: '#8b5cf6',
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '500',
  },
  soundNameSelected: {
    color: '#8b5cf6',
  },
  soundDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8b5cf6',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
