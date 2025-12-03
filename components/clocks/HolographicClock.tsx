import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(SCREEN_WIDTH - 40, 320);
const CENTER = CLOCK_SIZE / 2;

interface HolographicClockProps {
  viewMode?: 'face' | 'profile' | 'flat';
}

const colors = {
  ms: 'rgba(180, 100, 255, 1)',
  sec: 'rgba(100, 255, 150, 1)',
  min: 'rgba(100, 200, 255, 1)',
  hour: 'rgba(255, 100, 150, 1)',
  core: 'rgba(200, 230, 255, 1)',
  sync: 'rgba(150, 150, 200, 0.5)',
};

export default function HolographicClock({ viewMode = 'face' }: HolographicClockProps) {
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<'face' | 'profile' | 'flat'>(viewMode);
  const deployProgress = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const milliseconds = time.getMilliseconds();

  const msProgress = milliseconds / 1000;
  const secProgress = (seconds + milliseconds / 1000) / 60;
  const minProgress = (minutes + seconds / 60) / 60;
  const hourProgress = (hours + minutes / 60) / 12;

  // Scale factors based on clock size
  const scale = CLOCK_SIZE / 700;

  // Ring radii scaled
  const syncRadius = 240 * scale;
  const hourRadius = 190 * scale;
  const minRadius = 140 * scale;
  const secRadius = 95 * scale;
  const msRadius = 55 * scale;
  const coreRadius = 18 * scale;

  // Pan gesture for deployment
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Scroll down = deploy (positive Y), scroll up = collapse (negative Y)
      const newProgress = Math.max(0, Math.min(1, deployProgress.value + event.velocityY / 5000));
      deployProgress.value = newProgress;
    })
    .onEnd(() => {
      // Snap to 0 or 1
      if (deployProgress.value > 0.5) {
        deployProgress.value = withSpring(1, { damping: 15 });
      } else {
        deployProgress.value = withSpring(0, { damping: 15 });
      }
    });

  // Container animation based on view mode and deploy
  const containerStyle = useAnimatedStyle(() => {
    let rotateX = '0deg';
    let rotateY = '0deg';
    let scaleValue = 1;
    const deploy = deployProgress.value;

    if (mode === 'profile') {
      rotateY = `${50 + deploy * 20}deg`;
      rotateX = `${10 + deploy * 5}deg`;
      scaleValue = 0.85 - deploy * 0.15;
    } else if (mode === 'flat') {
      rotateX = `${60 + deploy * 15}deg`;
      scaleValue = 0.75 - deploy * 0.1;
    } else {
      // Face mode with slight 3D on deploy
      rotateX = `${deploy * 15}deg`;
      scaleValue = 1 - deploy * 0.1;
    }

    return {
      transform: [
        { perspective: 1000 },
        { rotateX },
        { rotateY },
        { scale: scaleValue },
      ],
    };
  });

  // Deploy indicator style
  const deployIndicatorStyle = useAnimatedStyle(() => ({
    height: `${deployProgress.value * 100}%`,
  }));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  // Needle component
  const Needle = ({ progress, length, color, width }: { progress: number; length: number; color: string; width: number }) => {
    const angle = progress * 360 - 90;
    const radians = (angle * Math.PI) / 180;
    const endX = CENTER + Math.cos(radians) * length * scale;
    const endY = CENTER + Math.sin(radians) * length * scale;

    return (
      <Line
        x1={CENTER}
        y1={CENTER}
        x2={endX}
        y2={endY}
        stroke={color}
        strokeWidth={width * scale}
        strokeLinecap="round"
      />
    );
  };

  // Progress indicator ball
  const ProgressBall = ({ progress, radius, size }: { progress: number; radius: number; size: number }) => {
    const angle = progress * 360 - 90;
    const radians = (angle * Math.PI) / 180;
    const x = CENTER + Math.cos(radians) * radius;
    const y = CENTER + Math.sin(radians) * radius;

    return (
      <Circle
        cx={x}
        cy={y}
        r={size * scale}
        fill="#fff"
      />
    );
  };

  // Tick marks for each ring
  const TickMarks = ({ count, innerRadius, outerRadius, color, activeProgress }: {
    count: number;
    innerRadius: number;
    outerRadius: number;
    color: string;
    activeProgress: number;
  }) => {
    const ticks = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360 - 90;
      const radians = (angle * Math.PI) / 180;
      const x1 = CENTER + Math.cos(radians) * innerRadius;
      const y1 = CENTER + Math.sin(radians) * innerRadius;
      const x2 = CENTER + Math.cos(radians) * outerRadius;
      const y2 = CENTER + Math.sin(radians) * outerRadius;
      const isActive = i / count <= activeProgress;

      ticks.push(
        <Line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth={1.5 * scale}
          opacity={isActive ? 0.9 : 0.2}
        />
      );
    }
    return <>{ticks}</>;
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.innerContainer}>
          {/* Digital Display Top */}
          <View style={styles.digitalTop}>
            <Text style={styles.timeMain}>{formatTime(time)}</Text>
          </View>

          {/* Deploy hint */}
          <Text style={styles.deployHint}>↕ Glisser pour déployer</Text>

          {/* Clock SVG */}
          <Animated.View style={[styles.clockContainer, containerStyle]}>
            <Svg width={CLOCK_SIZE} height={CLOCK_SIZE} viewBox={`0 0 ${CLOCK_SIZE} ${CLOCK_SIZE}`}>
              {/* Sync ring (outer decorative) */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={syncRadius}
                stroke={colors.sync}
                strokeWidth={1 * scale}
                strokeDasharray={`${3 * scale} ${3 * scale}`}
                fill="none"
              />

              {/* Hour ring background */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={hourRadius}
                stroke={colors.hour}
                strokeWidth={8 * scale}
                strokeOpacity={0.2}
                fill="none"
              />
              {/* Hour ring progress */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={hourRadius}
                stroke={colors.hour}
                strokeWidth={8 * scale}
                fill="none"
                strokeDasharray={`${2 * Math.PI * hourRadius * hourProgress} ${2 * Math.PI * hourRadius}`}
                strokeDashoffset={2 * Math.PI * hourRadius * 0.25}
                strokeLinecap="round"
              />
              {/* Hour ticks */}
              <TickMarks count={12} innerRadius={hourRadius + 15 * scale} outerRadius={hourRadius + 28 * scale} color={colors.hour} activeProgress={hourProgress} />
              {/* Hour ball */}
              <ProgressBall progress={hourProgress} radius={hourRadius} size={6} />

              {/* Minute ring background */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={minRadius}
                stroke={colors.min}
                strokeWidth={6 * scale}
                strokeOpacity={0.2}
                fill="none"
              />
              {/* Minute ring progress */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={minRadius}
                stroke={colors.min}
                strokeWidth={6 * scale}
                fill="none"
                strokeDasharray={`${2 * Math.PI * minRadius * minProgress} ${2 * Math.PI * minRadius}`}
                strokeDashoffset={2 * Math.PI * minRadius * 0.25}
                strokeLinecap="round"
              />
              {/* Minute ticks */}
              <TickMarks count={60} innerRadius={minRadius + 12 * scale} outerRadius={minRadius + 22 * scale} color={colors.min} activeProgress={minProgress} />
              {/* Minute ball */}
              <ProgressBall progress={minProgress} radius={minRadius} size={5} />

              {/* Second ring background */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={secRadius}
                stroke={colors.sec}
                strokeWidth={5 * scale}
                strokeOpacity={0.2}
                fill="none"
              />
              {/* Second ring progress */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={secRadius}
                stroke={colors.sec}
                strokeWidth={5 * scale}
                fill="none"
                strokeDasharray={`${2 * Math.PI * secRadius * secProgress} ${2 * Math.PI * secRadius}`}
                strokeDashoffset={2 * Math.PI * secRadius * 0.25}
                strokeLinecap="round"
              />
              {/* Second ticks */}
              <TickMarks count={60} innerRadius={secRadius + 10 * scale} outerRadius={secRadius + 18 * scale} color={colors.sec} activeProgress={secProgress} />
              {/* Second ball */}
              <ProgressBall progress={secProgress} radius={secRadius} size={4} />

              {/* MS ring background */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={msRadius}
                stroke={colors.ms}
                strokeWidth={4 * scale}
                strokeOpacity={0.2}
                fill="none"
              />
              {/* MS ring progress */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={msRadius}
                stroke={colors.ms}
                strokeWidth={4 * scale}
                fill="none"
                strokeDasharray={`${2 * Math.PI * msRadius * msProgress} ${2 * Math.PI * msRadius}`}
                strokeDashoffset={2 * Math.PI * msRadius * 0.25}
                strokeLinecap="round"
              />
              {/* MS ball */}
              <ProgressBall progress={msProgress} radius={msRadius} size={3} />

              {/* Needles */}
              <Needle progress={hourProgress} length={160} color={colors.hour} width={8} />
              <Needle progress={minProgress} length={115} color={colors.min} width={6} />
              <Needle progress={secProgress} length={80} color={colors.sec} width={4} />
              <Needle progress={msProgress} length={45} color={colors.ms} width={3} />

              {/* Core */}
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={coreRadius}
                stroke={colors.core}
                strokeWidth={5 * scale}
                fill="none"
              />
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={coreRadius - 8 * scale}
                fill={colors.min}
              />
              <Circle
                cx={CENTER}
                cy={CENTER}
                r={6 * scale}
                fill="#fff"
              />
            </Svg>
          </Animated.View>

          {/* Deploy indicator */}
          <View style={styles.deployIndicator}>
            <Animated.View style={[styles.deployFill, deployIndicatorStyle]} />
            <Text style={styles.deployLabel}>DÉPLOYER</Text>
          </View>

          {/* Digital Display Bottom */}
          <View style={styles.digitalBottom}>
            <Text style={styles.timeDate}>{formatDate(time)}</Text>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.ms }]} />
              <Text style={styles.legendText}>MS</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.sec }]} />
              <Text style={styles.legendText}>SEC</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.min }]} />
              <Text style={styles.legendText}>MIN</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.hour }]} />
              <Text style={styles.legendText}>HEURE</Text>
            </View>
          </View>

          {/* View Mode Buttons */}
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'face' && styles.modeButtonActive]}
              onPress={() => setMode('face')}
            >
              <Text style={[styles.modeButtonText, mode === 'face' && styles.modeButtonTextActive]}>FACE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'profile' && styles.modeButtonActive]}
              onPress={() => setMode('profile')}
            >
              <Text style={[styles.modeButtonText, mode === 'profile' && styles.modeButtonTextActive]}>PROFIL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'flat' && styles.modeButtonActive]}
              onPress={() => setMode('flat')}
            >
              <Text style={[styles.modeButtonText, mode === 'flat' && styles.modeButtonTextActive]}>PLAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  digitalTop: {
    marginBottom: 10,
    alignItems: 'center',
  },
  deployHint: {
    fontSize: 10,
    color: 'rgba(100, 200, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: 10,
  },
  timeMain: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(100, 200, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  clockContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deployIndicator: {
    position: 'absolute',
    right: 10,
    top: '30%',
    width: 4,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
  },
  deployFill: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(51, 171, 185, 0.8)',
    borderRadius: 2,
  },
  deployLabel: {
    position: 'absolute',
    right: 8,
    top: '50%',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    letterSpacing: 1,
    transform: [{ rotate: '-90deg' }, { translateX: 20 }],
  },
  digitalBottom: {
    marginTop: 15,
    alignItems: 'center',
  },
  timeDate: {
    fontSize: 12,
    color: 'rgba(150, 200, 255, 0.7)',
    letterSpacing: 3,
    textShadowColor: 'rgba(100, 200, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 15,
    backgroundColor: 'rgba(0, 10, 20, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(100, 200, 255, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendColor: {
    width: 16,
    height: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  modeButtons: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(24, 67, 68, 0.8)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#33ABB9',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(51, 171, 185, 0.5)',
  },
  modeButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 2,
  },
  modeButtonTextActive: {
    color: '#fff',
  },
});
