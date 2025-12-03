import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FluidClockProps {
  showSeconds?: boolean;
}

interface DigitProps {
  value: string;
  isChanging: boolean;
}

const FluidDigit = ({ value, isChanging }: DigitProps) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const blur = useSharedValue(0);

  useEffect(() => {
    if (isChanging) {
      // Exit animation
      translateY.value = withTiming(-30, { duration: 300, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });

      // Enter animation after exit
      setTimeout(() => {
        translateY.value = 30;
        opacity.value = 0;
        scale.value = 0.8;

        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(1, { duration: 400 });
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }, 300);
    }
  }, [isChanging, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.digitContainer}>
      <Animated.View style={[styles.digitInner, animatedStyle]}>
        <Text style={styles.digitText}>{value}</Text>
      </Animated.View>
    </View>
  );
};

const FluidColon = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const blink = () => {
      opacity.value = withTiming(0.3, { duration: 500 }, () => {
        opacity.value = withTiming(1, { duration: 500 });
      });
    };

    const interval = setInterval(blink, 1000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.colon, animatedStyle]}>:</Animated.Text>
  );
};

export default function FluidClock({ showSeconds = true }: FluidClockProps) {
  const [time, setTime] = useState({
    h0: '0', h1: '0',
    m0: '0', m1: '0',
    s0: '0', s1: '0',
  });
  const [changingDigits, setChangingDigits] = useState<Set<string>>(new Set());
  const prevTimeRef = useRef({ h0: '0', h1: '0', m0: '0', m1: '0', s0: '0', s1: '0' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');

      const newTime = {
        h0: h[0], h1: h[1],
        m0: m[0], m1: m[1],
        s0: s[0], s1: s[1],
      };

      // Detect changes
      const changed = new Set<string>();
      Object.keys(newTime).forEach(key => {
        if (prevTimeRef.current[key as keyof typeof newTime] !== newTime[key as keyof typeof newTime]) {
          changed.add(key);
        }
      });

      if (changed.size > 0) {
        setChangingDigits(changed);
        setTimeout(() => setChangingDigits(new Set()), 600);
      }

      prevTimeRef.current = newTime;
      setTime(newTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      {/* Glow effect */}
      <View style={styles.glowOuter} />
      <View style={styles.glowInner} />

      {/* Clock display */}
      <View style={styles.clockWrapper}>
        <View style={styles.clockRow}>
          <FluidDigit value={time.h0} isChanging={changingDigits.has('h0')} />
          <FluidDigit value={time.h1} isChanging={changingDigits.has('h1')} />
          <FluidColon />
          <FluidDigit value={time.m0} isChanging={changingDigits.has('m0')} />
          <FluidDigit value={time.m1} isChanging={changingDigits.has('m1')} />
          {showSeconds && (
            <>
              <FluidColon />
              <FluidDigit value={time.s0} isChanging={changingDigits.has('s0')} />
              <FluidDigit value={time.s1} isChanging={changingDigits.has('s1')} />
            </>
          )}
        </View>
      </View>

      {/* Date display */}
      <Text style={styles.dateText}>{formatDate()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  glowOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
  },
  glowInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 245, 255, 0.15)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  clockWrapper: {
    backgroundColor: 'rgba(10, 21, 32, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    padding: 20,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitContainer: {
    width: 45,
    height: 65,
    backgroundColor: 'rgba(0, 245, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.15)',
    marginHorizontal: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitText: {
    fontSize: 42,
    fontWeight: '200',
    color: '#00f5ff',
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 36,
    fontWeight: '300',
    color: '#00f5ff',
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginHorizontal: 4,
  },
  dateText: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(0, 245, 255, 0.6)',
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
});
