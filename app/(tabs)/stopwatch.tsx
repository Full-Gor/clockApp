import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  AppState,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Lap {
  id: number;
  time: number;
  lapTime: number;
}

export default function StopwatchScreen() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Theme colors
  const theme = {
    bg: darkMode ? ['#1a1a2e', '#16213e'] : ['#e8eef3', '#d4dde6'],
    cardBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    text: darkMode ? '#fff' : '#1a1a2e',
    subtext: darkMode ? '#9ca3af' : '#6b7280',
    shadowDark: darkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)',
    shadowLight: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
  };

  // Restaurer l'état au montage
  useEffect(() => {
    loadStopwatchState();
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

  // Gérer le passage en arrière-plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isRunning, time, laps]);

  const loadStopwatchState = async () => {
    try {
      const state = await AsyncStorage.getItem('stopwatchState');
      if (state) {
        const { isRunning: wasRunning, startTime, accumulated, savedLaps } = JSON.parse(state);
        if (wasRunning) {
          const elapsed = Date.now() - startTime + accumulated;
          accumulatedTimeRef.current = elapsed;
          setTime(elapsed);
          setIsRunning(true);
        } else if (accumulated > 0) {
          accumulatedTimeRef.current = accumulated;
          setTime(accumulated);
        }
        if (savedLaps) {
          setLaps(savedLaps);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du chrono:', error);
    }
  };

  const saveStopwatchState = async () => {
    try {
      const state = {
        isRunning,
        startTime: startTimeRef.current,
        accumulated: accumulatedTimeRef.current,
        savedLaps: laps,
      };
      await AsyncStorage.setItem('stopwatchState', JSON.stringify(state));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du chrono:', error);
    }
  };

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      saveStopwatchState();
    }
  };

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - accumulatedTimeRef.current;

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setTime(elapsed);
        accumulatedTimeRef.current = elapsed;
      }, 10);

      // Animation de pulsation pour l'indicateur
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
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
  }, [isRunning]);

  const formatTime = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((timeMs % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.elastic(1)),
      }),
    ]).start();
  };

  const handleStartPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButtonPress();

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
    animateButtonPress();
    setTime(0);
    setIsRunning(false);
    setLaps([]);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  const handleLap = () => {
    if (!isRunning) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animateButtonPress();

    const lapTime = laps.length === 0 ? time : time - laps[laps.length - 1].time;
    const newLap: Lap = {
      id: laps.length + 1,
      time: time,
      lapTime: lapTime,
    };

    setLaps(prevLaps => [newLap, ...prevLaps]);
  };

  const getBestAndWorstLap = () => {
    if (laps.length < 2) return { best: null, worst: null };

    const lapTimes = laps.map(lap => lap.lapTime);
    const minTime = Math.min(...lapTimes);
    const maxTime = Math.max(...lapTimes);

    return {
      best: laps.find(lap => lap.lapTime === minTime)?.id || null,
      worst: laps.find(lap => lap.lapTime === maxTime)?.id || null,
    };
  };

  const { best, worst } = getBestAndWorstLap();

  return (
    <LinearGradient colors={theme.bg as [string, string]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Chronomètre</Text>
          {isRunning && (
            <Animated.View
              style={[
                styles.recordingIndicator,
                {
                  transform: [{ scale: pulseAnimation }],
                  shadowColor: '#ef4444',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 8,
                }
              ]}
            />
          )}
        </View>

        {/* Time Display Card - Neumorphic 3D */}
        <View style={[
          styles.timeCard,
          {
            backgroundColor: theme.cardBg,
            shadowColor: theme.shadowDark,
            transform: [{ perspective: 1000 }, { rotateX: '2deg' }],
          }
        ]}>
          {/* Glossy overlay */}
          <View style={styles.glossOverlay} />

          <Text style={[styles.timeDisplay, { color: theme.text }]}>
            {formatTime(time)}
          </Text>

          <View style={[styles.statusPill, {
            backgroundColor: isRunning ? 'rgba(16, 185, 129, 0.2)' :
                           time === 0 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)'
          }]}>
            <View style={[styles.statusDot, {
              backgroundColor: isRunning ? '#10b981' : time === 0 ? '#8b5cf6' : '#f59e0b'
            }]} />
            <Text style={[styles.statusText, {
              color: isRunning ? '#10b981' : time === 0 ? '#8b5cf6' : '#f59e0b'
            }]}>
              {isRunning ? 'En cours' : time === 0 ? 'Prêt' : 'Pause'}
            </Text>
          </View>
        </View>

        {/* Control Buttons - Neumorphic 3D */}
        <View style={styles.controlsContainer}>
          {/* Reset Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: time === 0 && !isRunning ? 'rgba(107,114,128,0.3)' : '#ef4444',
                shadowColor: theme.shadowDark,
              }
            ]}
            onPress={handleReset}
            disabled={time === 0 && !isRunning}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={time === 0 && !isRunning
                ? ['rgba(107,114,128,0.1)', 'rgba(107,114,128,0.05)']
                : ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.1)']}
              style={styles.buttonGradient}
            >
              <RotateCcw size={24} color={time === 0 && !isRunning ? '#6b7280' : '#ef4444'} />
              <Text style={[styles.controlButtonText, {
                color: time === 0 && !isRunning ? '#6b7280' : '#ef4444'
              }]}>
                Reset
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Main Play/Pause Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity
              style={styles.mainButtonContainer}
              onPress={handleStartPause}
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
                {/* Glossy effect */}
                <View style={styles.mainButtonGloss} />
                {isRunning ? (
                  <Pause size={36} color="#fff" />
                ) : (
                  <Play size={36} color="#fff" style={{ marginLeft: 4 }} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Lap Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              {
                backgroundColor: theme.cardBg,
                borderColor: !isRunning ? 'rgba(107,114,128,0.3)' : '#10b981',
                shadowColor: theme.shadowDark,
              }
            ]}
            onPress={handleLap}
            disabled={!isRunning}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={!isRunning
                ? ['rgba(107,114,128,0.1)', 'rgba(107,114,128,0.05)']
                : ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.1)']}
              style={styles.buttonGradient}
            >
              <Flag size={24} color={!isRunning ? '#6b7280' : '#10b981'} />
              <Text style={[styles.controlButtonText, {
                color: !isRunning ? '#6b7280' : '#10b981'
              }]}>
                Tour
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Laps List - Neumorphic Cards */}
        {laps.length > 0 && (
          <View style={[styles.lapsContainer, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.lapsTitle, { color: theme.text }]}>
              Tours enregistrés ({laps.length})
            </Text>

            {/* Header Row */}
            <View style={styles.lapsHeader}>
              <Text style={[styles.lapsHeaderText, { color: theme.subtext }]}>Tour</Text>
              <Text style={[styles.lapsHeaderText, { color: theme.subtext }]}>Temps</Text>
              <Text style={[styles.lapsHeaderText, { color: theme.subtext }]}>Total</Text>
            </View>

            {/* Lap Items */}
            {laps.map((lap) => (
              <View
                key={lap.id}
                style={[
                  styles.lapItem,
                  lap.id === best && styles.bestLap,
                  lap.id === worst && styles.worstLap,
                  { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }
                ]}
              >
                <View style={styles.lapNumberContainer}>
                  <Text style={[
                    styles.lapNumber,
                    { color: theme.text },
                    lap.id === best && styles.bestLapText,
                    lap.id === worst && styles.worstLapText,
                  ]}>
                    {lap.id}
                  </Text>
                  {lap.id === best && (
                    <View style={[styles.lapBadge, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
                      <Text style={[styles.lapBadgeText, { color: '#10b981' }]}>BEST</Text>
                    </View>
                  )}
                  {lap.id === worst && (
                    <View style={[styles.lapBadge, { backgroundColor: 'rgba(239,68,68,0.2)' }]}>
                      <Text style={[styles.lapBadgeText, { color: '#ef4444' }]}>SLOW</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.lapTime,
                  { color: theme.subtext },
                  lap.id === best && styles.bestLapText,
                  lap.id === worst && styles.worstLapText,
                ]}>
                  {formatTime(lap.lapTime)}
                </Text>
                <Text style={[
                  styles.lapTotalTime,
                  { color: theme.subtext },
                  lap.id === best && styles.bestLapText,
                  lap.id === worst && styles.worstLapText,
                ]}>
                  {formatTime(lap.time)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {laps.length === 0 && time > 0 && (
          <View style={[styles.emptyState, { backgroundColor: theme.cardBg }]}>
            <Flag size={32} color={theme.subtext} />
            <Text style={[styles.emptyStateText, { color: theme.subtext }]}>
              Appuyez sur Tour pour enregistrer un temps intermédiaire
            </Text>
          </View>
        )}
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  recordingIndicator: {
    width: 14,
    height: 14,
    backgroundColor: '#ef4444',
    borderRadius: 7,
    marginLeft: 12,
  },

  // Time Card - Neumorphic 3D
  timeCard: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: '200',
    letterSpacing: -3,
    fontFamily: 'System',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Control Buttons
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
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
  controlButtonText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  mainButtonContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  mainButton: {
    width: 100,
    height: 100,
    borderRadius: 28,
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Laps Container
  lapsContainer: {
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
  lapsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  lapsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 8,
  },
  lapsHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  bestLap: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  worstLap: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  lapNumberContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  lapBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lapBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  lapTime: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'System',
  },
  lapTotalTime: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'System',
  },
  bestLapText: {
    color: '#10b981',
  },
  worstLapText: {
    color: '#ef4444',
  },

  // Empty State
  emptyState: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
