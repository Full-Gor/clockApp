import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Lap {
  id: number;
  time: number;
  lapTime: number;
}

export default function StopwatchScreen() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

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
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
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
    setTime(0);
    setIsRunning(false);
    setLaps([]);
    accumulatedTimeRef.current = 0;
    startTimeRef.current = 0;
  };

  const handleLap = () => {
    if (!isRunning) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
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
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chronomètre</Text>
          {isRunning && (
            <Animated.View 
              style={[
                styles.recordingIndicator,
                { transform: [{ scale: pulseAnimation }] }
              ]}
            />
          )}
        </View>

        {/* Affichage du temps */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeDisplay}>{formatTime(time)}</Text>
          <Text style={styles.millisecondsLabel}>
            {isRunning ? 'En cours...' : time === 0 ? 'Prêt' : 'Arrêté'}
          </Text>
        </View>

        {/* Boutons de contrôle */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={handleReset}
            disabled={time === 0 && !isRunning}
          >
            <RotateCcw size={24} color={time === 0 && !isRunning ? '#6b7280' : '#ef4444'} />
            <Text style={[styles.controlButtonText, { color: time === 0 && !isRunning ? '#6b7280' : '#ef4444' }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
            <TouchableOpacity
              style={[styles.mainButton, isRunning ? styles.pauseButton : styles.playButton]}
              onPress={handleStartPause}
            >
              {isRunning ? (
                <Pause size={32} color="#fff" />
              ) : (
                <Play size={32} color="#fff" />
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.controlButton, styles.lapButton]}
            onPress={handleLap}
            disabled={!isRunning}
          >
            <Flag size={24} color={!isRunning ? '#6b7280' : '#10b981'} />
            <Text style={[styles.controlButtonText, { color: !isRunning ? '#6b7280' : '#10b981' }]}>
              Tour
            </Text>
          </TouchableOpacity>
        </View>

        {/* Liste des tours */}
        {laps.length > 0 && (
          <View style={styles.lapsContainer}>
            <Text style={styles.lapsTitle}>Tours enregistrés</Text>
            <View style={styles.lapsHeader}>
              <Text style={styles.lapsHeaderText}>Tour</Text>
              <Text style={styles.lapsHeaderText}>Temps du tour</Text>
              <Text style={styles.lapsHeaderText}>Temps total</Text>
            </View>
            
            {laps.map((lap, index) => (
              <View 
                key={lap.id} 
                style={[
                  styles.lapItem,
                  lap.id === best && styles.bestLap,
                  lap.id === worst && styles.worstLap,
                ]}
              >
                <Text style={[
                  styles.lapNumber,
                  lap.id === best && styles.bestLapText,
                  lap.id === worst && styles.worstLapText,
                ]}>
                  {lap.id}
                </Text>
                <Text style={[
                  styles.lapTime,
                  lap.id === best && styles.bestLapText,
                  lap.id === worst && styles.worstLapText,
                ]}>
                  {formatTime(lap.lapTime)}
                </Text>
                <Text style={[
                  styles.lapTotalTime,
                  lap.id === best && styles.bestLapText,
                  lap.id === worst && styles.worstLapText,
                ]}>
                  {formatTime(lap.time)}
                </Text>
              </View>
            ))}
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
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  recordingIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#ef4444',
    borderRadius: 6,
    marginLeft: 12,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  timeDisplay: {
    fontSize: 64,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -2,
    fontFamily: 'system',
  },
  millisecondsLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  resetButton: {
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  lapButton: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mainButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  lapsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  lapsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  lapsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  lapsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    flex: 1,
    textAlign: 'center',
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 4,
  },
  bestLap: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  worstLap: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  lapNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  lapTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#d1d5db',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'system',
  },
  lapTotalTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'system',
  },
  bestLapText: {
    color: '#10b981',
  },
  worstLapText: {
    color: '#ef4444',
  },
});