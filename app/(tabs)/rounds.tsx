import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Settings, SkipForward, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { soundManager } from '@/services/soundService';
import { CustomAlert } from '@/components/CustomAlert';

type Phase = 'prepare' | 'round' | 'rest' | 'finished';

export default function RoundsScreen() {
  // Configuration
  const [rounds, setRounds] = useState(3);
  const [roundDuration, setRoundDuration] = useState(180); // 3 minutes en secondes
  const [restDuration, setRestDuration] = useState(60); // 1 minute
  const [prepareDuration, setPrepareDuration] = useState(10); // 10 secondes
  const [warningTime, setWarningTime] = useState(10); // Alerte 10s avant la fin

  // État du timer
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [timeLeft, setTimeLeft] = useState(prepareDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      endTimeRef.current = Date.now() + (timeLeft * 1000);

      intervalRef.current = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

        // Alerte avant la fin du round
        if (remaining === warningTime && (phase === 'round' || phase === 'rest') && !hasPlayedWarning) {
          playSound('warning');
          setHasPlayedWarning(true);
        }

        if (remaining <= 0) {
          setTimeLeft(0);
          handlePhaseComplete();
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
  }, [isRunning, phase]);

  const handlePhaseComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setHasPlayedWarning(false);

    if (phase === 'prepare') {
      // Fin de la préparation, début du premier round
      playSound('bell');
      setPhase('round');
      setTimeLeft(roundDuration);
    } else if (phase === 'round') {
      // Fin du round
      playSound('bell');

      if (currentRound >= rounds) {
        // Fin de tous les rounds
        setPhase('finished');
        setIsRunning(false);
        showCompletionMessage();
      } else {
        // Passer au repos
        setPhase('rest');
        setTimeLeft(restDuration);
      }
    } else if (phase === 'rest') {
      // Fin du repos, round suivant
      playSound('bell');
      setCurrentRound(prev => prev + 1);
      setPhase('round');
      setTimeLeft(roundDuration);
    }
  };

  const playSound = async (type: 'bell' | 'warning') => {
    if (isMuted) return;

    try {
      if (type === 'bell') {
        await soundManager.playAlarmSound('bell');
      } else {
        await soundManager.playAlarmSound('beep');
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du son:', error);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  const showCompletionMessage = () => {
    setShowCompletionAlert(true);
  };

  const handleStopAlarm = async () => {
    await soundManager.stopCurrentAlarm();
    setShowCompletionAlert(false);
    handleReset();
  };

  const handleStartPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
    setCurrentRound(1);
    setPhase('prepare');
    setTimeLeft(prepareDuration);
    setHasPlayedWarning(false);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasPlayedWarning(false);
    handlePhaseComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const total = phase === 'prepare' ? prepareDuration :
                  phase === 'round' ? roundDuration : restDuration;
    return total > 0 ? (total - timeLeft) / total : 0;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'prepare':
        return '#f59e0b'; // Orange
      case 'round':
        return '#ef4444'; // Rouge
      case 'rest':
        return '#10b981'; // Vert
      case 'finished':
        return '#8b5cf6'; // Violet
      default:
        return '#8b5cf6';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'prepare':
        return 'PRÉPARATION';
      case 'round':
        return 'ROUND';
      case 'rest':
        return 'REPOS';
      case 'finished':
        return 'TERMINÉ';
      default:
        return '';
    }
  };

  const presets = [
    { label: 'Boxe (3 min)', rounds: 3, round: 180, rest: 60, prepare: 10 },
    { label: 'HIIT (30s)', rounds: 8, round: 30, rest: 15, prepare: 5 },
    { label: 'Tabata (20s)', rounds: 8, round: 20, rest: 10, prepare: 5 },
    { label: 'Combat (5 min)', rounds: 5, round: 300, rest: 90, prepare: 10 },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setRounds(preset.rounds);
    setRoundDuration(preset.round);
    setRestDuration(preset.rest);
    setPrepareDuration(preset.prepare);
    handleReset();
    setShowSettings(false);
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Timer de Rounds</Text>
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
              onPress={() => setShowSettings(true)}
              disabled={isRunning}
            >
              <Settings size={20} color={isRunning ? '#6b7280' : '#8b5cf6'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Indicateur de round */}
        <View style={styles.roundIndicator}>
          <Text style={styles.roundText}>
            ROUND {currentRound} / {rounds}
          </Text>
        </View>

        {/* Cercle de progression */}
        <View style={styles.circleContainer}>
          <View style={[styles.progressCircle, { borderColor: getPhaseColor() }]}>
            <View style={[styles.progressBar, {
              transform: [{ rotate: `${getProgress() * 360}deg` }],
              borderTopColor: getPhaseColor(),
              borderRightColor: getPhaseColor(),
            }]} />
            <View style={styles.innerCircle}>
              <Text style={[styles.phaseLabel, { color: getPhaseColor() }]}>
                {getPhaseLabel()}
              </Text>
              <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
              {phase === 'round' && (
                <Text style={styles.phaseSubtext}>Temps de travail</Text>
              )}
              {phase === 'rest' && (
                <Text style={styles.phaseSubtext}>Temps de repos</Text>
              )}
              {phase === 'prepare' && (
                <Text style={styles.phaseSubtext}>Préparez-vous...</Text>
              )}
            </View>
          </View>
        </View>

        {/* Boutons de contrôle */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
          >
            <RotateCcw size={24} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, isRunning ? styles.pauseButton : styles.playButton]}
            onPress={handleStartPause}
            disabled={phase === 'finished'}
          >
            {isRunning ? (
              <Pause size={36} color="#fff" />
            ) : (
              <Play size={36} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.skipButton]}
            onPress={handleSkip}
            disabled={!isRunning && phase !== 'prepare'}
          >
            <SkipForward size={24} color={(!isRunning && phase !== 'prepare') ? '#6b7280' : '#8b5cf6'} />
          </TouchableOpacity>
        </View>

        {/* Configuration rapide */}
        {!isRunning && phase === 'prepare' && currentRound === 1 && (
          <View style={styles.quickConfig}>
            <Text style={styles.quickConfigTitle}>Configuration actuelle</Text>
            <View style={styles.configGrid}>
              <View style={styles.configItem}>
                <Text style={styles.configValue}>{rounds}</Text>
                <Text style={styles.configLabel}>Rounds</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configValue}>{formatTime(roundDuration)}</Text>
                <Text style={styles.configLabel}>Round</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configValue}>{formatTime(restDuration)}</Text>
                <Text style={styles.configLabel}>Repos</Text>
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configValue}>{prepareDuration}s</Text>
                <Text style={styles.configLabel}>Préparation</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de configuration */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.modalCancelButton}>Fermer</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Configuration</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Préréglages */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Préréglages</Text>
              <View style={styles.presetsGrid}>
                {presets.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.presetCard}
                    onPress={() => applyPreset(preset)}
                  >
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                    <Text style={styles.presetDetails}>
                      {preset.rounds} rounds × {formatTime(preset.round)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Configuration personnalisée */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuration personnalisée</Text>

              <View style={styles.configRow}>
                <Text style={styles.configRowLabel}>Nombre de rounds</Text>
                <View style={styles.configRowControls}>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRounds(Math.max(1, rounds - 1))}
                  >
                    <Text style={styles.configButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.configRowValue}>{rounds}</Text>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRounds(Math.min(99, rounds + 1))}
                  >
                    <Text style={styles.configButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configRowLabel}>Durée du round</Text>
                <View style={styles.configRowControls}>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRoundDuration(Math.max(10, roundDuration - 10))}
                  >
                    <Text style={styles.configButtonText}>-10s</Text>
                  </TouchableOpacity>
                  <Text style={styles.configRowValue}>{formatTime(roundDuration)}</Text>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRoundDuration(Math.min(3600, roundDuration + 10))}
                  >
                    <Text style={styles.configButtonText}>+10s</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configRowLabel}>Durée du repos</Text>
                <View style={styles.configRowControls}>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRestDuration(Math.max(5, restDuration - 5))}
                  >
                    <Text style={styles.configButtonText}>-5s</Text>
                  </TouchableOpacity>
                  <Text style={styles.configRowValue}>{formatTime(restDuration)}</Text>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setRestDuration(Math.min(600, restDuration + 5))}
                  >
                    <Text style={styles.configButtonText}>+5s</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configRowLabel}>Préparation</Text>
                <View style={styles.configRowControls}>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setPrepareDuration(Math.max(3, prepareDuration - 1))}
                  >
                    <Text style={styles.configButtonText}>-1s</Text>
                  </TouchableOpacity>
                  <Text style={styles.configRowValue}>{prepareDuration}s</Text>
                  <TouchableOpacity
                    style={styles.configButton}
                    onPress={() => setPrepareDuration(Math.min(60, prepareDuration + 1))}
                  >
                    <Text style={styles.configButtonText}>+1s</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  handleReset();
                  setShowSettings(false);
                }}
              >
                <Text style={styles.applyButtonText}>Appliquer et réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* Alerte de fin d'entraînement */}
      <CustomAlert
        visible={showCompletionAlert}
        title="Entraînement terminé !"
        message={`Vous avez complété ${rounds} round${rounds > 1 ? 's' : ''} !`}
        icon="round"
        showStopButton={!isMuted}
        onStop={handleStopAlarm}
        onDismiss={() => {
          setShowCompletionAlert(false);
          handleReset();
        }}
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
    marginBottom: 20,
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
  roundIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  roundText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    letterSpacing: 2,
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressCircle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 4,
  },
  progressBar: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 150,
    borderWidth: 8,
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  innerCircle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -2,
  },
  phaseSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
    marginBottom: 30,
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
  skipButton: {
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  mainButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  quickConfig: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickConfigTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  configGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
  },
  configItem: {
    alignItems: 'center',
  },
  configValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  configLabel: {
    fontSize: 12,
    color: '#9ca3af',
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
    marginBottom: 30,
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  presetsGrid: {
    gap: 12,
  },
  presetCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  presetDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  configRowLabel: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  configRowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    minWidth: 60,
    alignItems: 'center',
  },
  configButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  configRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    minWidth: 60,
    textAlign: 'center',
  },
  applyButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
