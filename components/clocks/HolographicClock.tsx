import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, G, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLOCK_SIZE = Math.min(SCREEN_WIDTH - 40, 320);
const CENTER = CLOCK_SIZE / 2;

interface HolographicClockProps {
  viewMode?: 'face' | 'profile' | 'flat';
  deployProgress?: number;
}

const colors = {
  ms: 'rgba(180, 100, 255, 1)',
  sec: 'rgba(100, 255, 150, 1)',
  min: 'rgba(100, 200, 255, 1)',
  hour: 'rgba(255, 100, 150, 1)',
  core: 'rgba(200, 230, 255, 1)',
  sync: 'rgba(150, 150, 200, 0.5)',
};

export default function HolographicClock({ viewMode = 'face', deployProgress = 0 }: HolographicClockProps) {
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState<'face' | 'profile' | 'flat'>(viewMode);
  const deploy = useSharedValue(deployProgress);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    deploy.value = withTiming(deployProgress, { duration: 300 });
  }, [deployProgress]);

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

  // Container animation based on view mode
  const containerStyle = useAnimatedStyle(() => {
    let rotateX = '0deg';
    let rotateY = '0deg';
    let scaleValue = 1;

    if (mode === 'profile') {
      rotateY = '50deg';
      rotateX = '10deg';
      scaleValue = 0.85;
    } else if (mode === 'flat') {
      rotateX = '60deg';
      scaleValue = 0.75;
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

  // Draw arc progress
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
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
  const ProgressBall = ({ progress, radius, color, size }: { progress: number; radius: number; color: string; size: number }) => {
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
    <View style={styles.container}>
      {/* Digital Display Top */}
      <View style={styles.digitalTop}>
        <Text style={styles.timeMain}>{formatTime(time)}</Text>
      </View>

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
          <ProgressBall progress={hourProgress} radius={hourRadius} color={colors.hour} size={6} />

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
          <ProgressBall progress={minProgress} radius={minRadius} color={colors.min} size={5} />

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
          <ProgressBall progress={secProgress} radius={secRadius} color={colors.sec} size={4} />

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
          <ProgressBall progress={msProgress} radius={msRadius} color={colors.ms} size={3} />

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
          <Text style={styles.legendText}>HOUR</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  digitalTop: {
    marginBottom: 15,
    alignItems: 'center',
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
