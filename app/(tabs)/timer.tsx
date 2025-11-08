import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Bell, Upload } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { soundManager, ALARM_SOUNDS } from '@/services/soundService';
import { TimerPicker } from '@/components/TimerPicker';

export default function TimerScreen() {
  const [initialTime, setInitialTime] = useState(60); // en secondes
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState('classic');
  const [isMuted, setIsMuted] = useState(false);
  const [soundsRefreshKey, setSoundsRefreshKey] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);

  // Charger les sons personnalisés au montage du composant
  useEffect(() => {
    const loadCustomSounds = async () => {
      await soundManager.initialize();
      await soundManager.loadCustomSounds();
      setSoundsRefreshKey(prev => prev + 1);
    };
    loadCustomSounds();
  }, []);

  // Rafraîchir la liste des sons quand la modal s'ouvre
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
    if (isRunning && timeLeft > 0) {
      endTimeRef.current = Date.now() + (timeLeft * 1000);

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
      // Jouer le son d'alarme
      try {
        await soundManager.playAlarmSound(selectedSound);
      } catch (error) {
        console.error('Erreur lors de la lecture du son:', error);
        // Fallback sur les vibrations
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } else {
      // Si muet, seulement les vibrations
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      '⏰ Temps écoulé !',
      'Votre minuteur est terminé.',
      [
        {
          text: 'OK',
          onPress: () => {}
        }
      ]
    );
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

  const getCurrentSoundName = () => {
    const sound = ALARM_SOUNDS.find(s => s.id === selectedSound);
    return sound ? sound.name : 'Classique';
  };

  const handleAddCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const defaultName = file.name.replace(/\.[^/.]+$/, ''); // Nom du fichier sans extension

      try {
        const customSound = await soundManager.addCustomSound(defaultName, file.uri);
        setSelectedSound(customSound.id);
        setSoundsRefreshKey(prev => prev + 1); // Rafraîchir la liste
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

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Minuteur</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX size={20} color="#9ca3af" />
              ) : (
                <Volume2 size={20} color="#8b5cf6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                setShowSoundPicker(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Bell size={20} color="#8b5cf6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cercle de progression */}
        <View style={styles.circleContainer}>
          <View style={styles.progressCircle}>
            <View style={[styles.progressBar, {
              transform: [{ rotate: `${getProgress() * 360}deg` }]
            }]} />
            <View style={styles.innerCircle}>
              <TouchableOpacity
                style={styles.timeDisplay}
                onPress={() => !isRunning && setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.timeSubtext}>
                  {isRunning ? 'En cours...' : 'Appuyez pour modifier'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Boutons de contrôle */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
            disabled={timeLeft === initialTime && !isRunning}
          >
            <RotateCcw size={24} color={timeLeft === initialTime && !isRunning ? '#6b7280' : '#ef4444'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, isRunning ? styles.pauseButton : styles.playButton]}
            onPress={handleStartPause}
            disabled={timeLeft === 0}
          >
            {isRunning ? (
              <Pause size={32} color="#fff" />
            ) : (
              <Play size={32} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.settingsButton]}
            onPress={() => setShowTimePicker(true)}
            disabled={isRunning}
          >
            <Settings size={24} color={isRunning ? '#6b7280' : '#8b5cf6'} />
          </TouchableOpacity>
        </View>

        {/* Temps prédéfinis */}
        {!isRunning && (
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>Durées rapides</Text>
            <View style={styles.presetsGrid}>
              {presetTimes.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.presetButton,
                    initialTime === preset.seconds && styles.presetButtonActive
                  ]}
                  onPress={() => handlePresetTime(preset.seconds)}
                >
                  <Text style={[
                    styles.presetButtonText,
                    initialTime === preset.seconds && styles.presetButtonTextActive
                  ]}>
                    {preset.label}
                  </Text>
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
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSoundPicker(false)}>
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sons d'alarme</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Bouton pour ajouter un son personnalisé */}
          <TouchableOpacity style={styles.addSoundButton} onPress={handleAddCustomSound}>
            <Upload size={20} color="#8b5cf6" />
            <Text style={styles.addSoundButtonText}>Ajouter un fichier MP3</Text>
          </TouchableOpacity>

          <ScrollView style={styles.soundsList}>
            {ALARM_SOUNDS.map((sound) => (
              <View key={sound.id} style={styles.soundItem}>
                <TouchableOpacity
                  style={[
                    styles.soundOption,
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
                      selectedSound === sound.id && styles.soundNameSelected
                    ]}>
                      {sound.name}
                    </Text>
                    <Text style={styles.soundDescription}>{sound.description}</Text>
                  </View>
                  
                  {selectedSound === sound.id && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => previewSound(sound.id)}
                >
                  <Volume2 size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressCircle: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 140,
    borderWidth: 8,
    borderColor: '#8b5cf6',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  innerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -1,
  },
  timeSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  presetsContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  presetsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: '#8b5cf6',
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
  },
  presetButtonTextActive: {
    color: '#8b5cf6',
  },
  soundContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  soundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  soundSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  soundButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  soundButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  previewButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 60,
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  settingsButton: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playButton: {
    backgroundColor: '#10b981',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  // Styles pour la modale de sélection de son
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
    color: '#fff',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  addSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 12,
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
    marginBottom: 8,
  },
  soundOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  soundOptionSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  soundNameSelected: {
    color: '#8b5cf6',
  },
  soundDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});