import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Settings, SkipForward, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { soundManager } from '@/services/soundService';
import { CustomAlert } from '@/components/CustomAlert';

type Phase = 'prepare' | 'round' | 'rest' | 'finished';

export default function RoundsScreen() {
  // Configuration
  const [rounds, setRounds] = useState(3);
  const [roundDuration, setRoundDuration] = useState(180);
  const [restDuration, setRestDuration] = useState(60);
  const [prepareDuration, setPrepareDuration] = useState(10);
  const [warningTime, setWarningTime] = useState(10);

  // État du timer
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState<Phase>('prepare');
  const [timeLeft, setTimeLeft] = useState(prepareDuration);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);
  const [showCompletionAlert, setShowCompletionAlert] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number>(0);
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

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
    if (isRunning && timeLeft > 0) {
      endTimeRef.current = Date.now() + (timeLeft * 1000);

      // Pulse animation during running
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      intervalRef.current = setInterval(() => {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

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
      pulseAnimation.setValue(1);
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
      playSound('bell');
      setPhase('round');
      setTimeLeft(roundDuration);
    } else if (phase === 'round') {
      playSound('bell');

      if (currentRound >= rounds) {
        setPhase('finished');
        setIsRunning(false);
        showCompletionMessage();
      } else {
        setPhase('rest');
        setTimeLeft(restDuration);
      }
    } else if (phase === 'rest') {
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
      case 'prepare': return '#f59e0b';
      case 'round': return '#ef4444';
      case 'rest': return '#10b981';
      case 'finished': return '#8b5cf6';
      default: return '#8b5cf6';
    }
  };

  const getPhaseGradient = (): [string, string] => {
    switch (phase) {
      case 'prepare': return ['#f59e0b', '#d97706'];
      case 'round': return ['#ef4444', '#dc2626'];
      case 'rest': return ['#10b981', '#059669'];
      case 'finished': return ['#8b5cf6', '#7c3aed'];
      default: return ['#8b5cf6', '#7c3aed'];
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case 'prepare': return 'PRÉPARATION';
      case 'round': return 'ROUND';
      case 'rest': return 'REPOS';
      case 'finished': return 'TERMINÉ';
      default: return '';
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
    <LinearGradient colors={theme.bg as [string, string]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Timer de Rounds</Text>
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
              onPress={() => setShowSettings(true)}
              disabled={isRunning}
            >
              <Settings size={20} color={isRunning ? theme.subtext : '#8b5cf6'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Round Indicator - Neumorphic Pills */}
        <View style={styles.roundIndicatorContainer}>
          {Array.from({ length: rounds }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.roundDot,
                {
                  backgroundColor: index + 1 < currentRound ? getPhaseColor() :
                                   index + 1 === currentRound ? getPhaseColor() :
                                   darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  opacity: index + 1 <= currentRound ? 1 : 0.5,
                  transform: [{ scale: index + 1 === currentRound ? 1.3 : 1 }],
                }
              ]}
            />
          ))}
        </View>

        <Text style={[styles.roundText, { color: getPhaseColor() }]}>
          ROUND {currentRound} / {rounds}
        </Text>

        {/* Progress Circle - Neumorphic 3D */}
        <View style={styles.circleContainer}>
          <Animated.View style={[
            styles.progressCircleOuter,
            {
              backgroundColor: theme.cardBg,
              borderColor: `${getPhaseColor()}40`,
              transform: [{ scale: pulseAnimation }],
            }
          ]}>
            {/* Progress Ring */}
            <View style={styles.progressRing}>
              <View style={[
                styles.progressTrack,
                { borderColor: `${getPhaseColor()}30` }
              ]} />
            </View>

            {/* Inner Circle */}
            <View style={[styles.innerCircle, { backgroundColor: theme.cardBg }]}>
              <View style={styles.glossOverlay} />

              <LinearGradient
                colors={getPhaseGradient()}
                style={styles.phaseBadge}
              >
                <View style={styles.phaseBadgeGloss} />
                <Text style={styles.phaseLabel}>{getPhaseLabel()}</Text>
              </LinearGradient>

              <Text style={[styles.timeText, { color: theme.text }]}>
                {formatTime(timeLeft)}
              </Text>

              <Text style={[styles.phaseSubtext, { color: theme.subtext }]}>
                {phase === 'round' && 'Temps de travail'}
                {phase === 'rest' && 'Temps de repos'}
                {phase === 'prepare' && 'Préparez-vous...'}
                {phase === 'finished' && 'Bravo !'}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: '#ef4444',
              }
            ]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)']}
              style={styles.buttonGradient}
            >
              <RotateCcw size={24} color="#ef4444" />
            </LinearGradient>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity
              style={styles.mainButtonContainer}
              onPress={handleStartPause}
              disabled={phase === 'finished'}
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
                  <Pause size={36} color="#fff" />
                ) : (
                  <Play size={36} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: (!isRunning && phase !== 'prepare') ? 'rgba(107,114,128,0.3)' : '#8b5cf6',
              }
            ]}
            onPress={handleSkip}
            disabled={!isRunning && phase !== 'prepare'}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={(!isRunning && phase !== 'prepare')
                ? ['rgba(107,114,128,0.1)', 'rgba(107,114,128,0.05)']
                : ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.1)']}
              style={styles.buttonGradient}
            >
              <SkipForward size={24} color={(!isRunning && phase !== 'prepare') ? '#6b7280' : '#8b5cf6'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Config - Neumorphic Card */}
        {!isRunning && phase === 'prepare' && currentRound === 1 && (
          <View style={[styles.quickConfig, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.quickConfigTitle, { color: theme.text }]}>
              Configuration actuelle
            </Text>
            <View style={styles.configGrid}>
              {[
                { value: rounds, label: 'Rounds', color: '#8b5cf6' },
                { value: formatTime(roundDuration), label: 'Round', color: '#ef4444' },
                { value: formatTime(restDuration), label: 'Repos', color: '#10b981' },
                { value: `${prepareDuration}s`, label: 'Préparation', color: '#f59e0b' },
              ].map((item, index) => (
                <View key={index} style={styles.configItem}>
                  <Text style={[styles.configValue, { color: item.color }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.configLabel, { color: theme.subtext }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
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
        <LinearGradient colors={theme.bg as [string, string]} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.modalCancelButton}>Fermer</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Configuration</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Préréglages */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Préréglages</Text>
              <View style={styles.presetsGrid}>
                {presets.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => applyPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.05)']}
                      style={[styles.presetCard, { borderColor: 'rgba(139,92,246,0.3)' }]}
                    >
                      <View style={styles.presetGloss} />
                      <Text style={[styles.presetLabel, { color: theme.text }]}>{preset.label}</Text>
                      <Text style={[styles.presetDetails, { color: theme.subtext }]}>
                        {preset.rounds} rounds × {formatTime(preset.round)}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Configuration personnalisée */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Configuration personnalisée
              </Text>

              {[
                { label: 'Nombre de rounds', value: rounds, setValue: setRounds, min: 1, max: 99, step: 1, format: (v: number) => v.toString() },
                { label: 'Durée du round', value: roundDuration, setValue: setRoundDuration, min: 10, max: 3600, step: 10, format: formatTime },
                { label: 'Durée du repos', value: restDuration, setValue: setRestDuration, min: 5, max: 600, step: 5, format: formatTime },
                { label: 'Préparation', value: prepareDuration, setValue: setPrepareDuration, min: 3, max: 60, step: 1, format: (v: number) => `${v}s` },
              ].map((config, index) => (
                <View key={index} style={[styles.configRow, { backgroundColor: theme.cardBg }]}>
                  <Text style={[styles.configRowLabel, { color: theme.text }]}>
                    {config.label}
                  </Text>
                  <View style={styles.configRowControls}>
                    <TouchableOpacity
                      style={styles.configButton}
                      onPress={() => config.setValue(Math.max(config.min, config.value - config.step))}
                    >
                      <Text style={styles.configButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.configRowValue, { color: theme.text }]}>
                      {config.format(config.value)}
                    </Text>
                    <TouchableOpacity
                      style={styles.configButton}
                      onPress={() => config.setValue(Math.min(config.max, config.value + config.step))}
                    >
                      <Text style={styles.configButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  handleReset();
                  setShowSettings(false);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  style={styles.applyButtonGradient}
                >
                  <View style={styles.applyButtonGloss} />
                  <Text style={styles.applyButtonText}>Appliquer et réinitialiser</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>

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

  // Round Indicator
  roundIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  roundDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roundText: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 20,
  },

  // Progress Circle
  circleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  progressCircleOuter: {
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  progressRing: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  progressTrack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 140,
    borderWidth: 8,
  },
  innerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
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
    borderTopLeftRadius: 125,
    borderTopRightRadius: 125,
  },
  phaseBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  phaseBadgeGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  timeText: {
    fontSize: 56,
    fontWeight: '300',
    letterSpacing: -2,
  },
  phaseSubtext: {
    fontSize: 14,
    marginTop: 8,
  },

  // Control Buttons
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 40,
    marginBottom: 30,
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
    width: 90,
    height: 90,
    borderRadius: 26,
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },

  // Quick Config
  quickConfig: {
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
  quickConfigTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  configGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  configItem: {
    alignItems: 'center',
  },
  configValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  configLabel: {
    fontSize: 12,
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
    marginBottom: 16,
  },
  presetsGrid: {
    gap: 12,
  },
  presetCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  presetGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDetails: {
    fontSize: 14,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  configRowLabel: {
    fontSize: 16,
    flex: 1,
  },
  configRowControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  configButton: {
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#8b5cf6',
    minWidth: 50,
    alignItems: 'center',
  },
  configButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  configRowValue: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  applyButton: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyButtonGradient: {
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  applyButtonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
