import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface FlapClockProps {
  theme?: 'dark' | 'light';
  showSeconds?: boolean;
}

interface SplitFlapDigitProps {
  value: string;
  isChanging: boolean;
  light?: boolean;
}

const SplitFlapDigit = ({ value, isChanging, light = false }: SplitFlapDigitProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [nextValue, setNextValue] = useState(value);
  const topFlapRotation = useSharedValue(0);
  const bottomFlapRotation = useSharedValue(90);
  const prevValueRef = useRef(value);

  const colors = light ? {
    containerBg: '#fff',
    topBg: '#f0f0f0',
    bottomBg: '#fafafa',
    centerLine: '#d0d0d0',
    digitColor: '#1a1a1a',
    shadow: 'rgba(0,0,0,0.15)',
    rivetBg: '#999',
  } : {
    containerBg: '#111',
    topBg: '#1e1e1e',
    bottomBg: '#0f0f0f',
    centerLine: '#0a0a0a',
    digitColor: '#e8e8e8',
    shadow: 'rgba(0,0,0,0.5)',
    rivetBg: '#444',
  };

  useEffect(() => {
    if (isChanging && value !== prevValueRef.current) {
      setNextValue(value);

      // Top flap falls down
      topFlapRotation.value = withTiming(-90, {
        duration: 150,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(setDisplayValue)(value);
        topFlapRotation.value = 0;
      });

      // Bottom flap follows
      bottomFlapRotation.value = 90;
      bottomFlapRotation.value = withSequence(
        withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(-10, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      prevValueRef.current = value;
    } else if (!isChanging) {
      setDisplayValue(value);
    }
  }, [isChanging, value]);

  const topFlapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateX: `${topFlapRotation.value}deg` },
    ],
  }));

  const bottomFlapStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 400 },
      { rotateX: `${bottomFlapRotation.value}deg` },
    ],
  }));

  return (
    <View style={[styles.digitWrapper, { backgroundColor: colors.containerBg, shadowColor: colors.shadow }]}>
      {/* Static background top */}
      <View style={[styles.halfTop, { backgroundColor: colors.topBg }]}>
        <Text style={[styles.digitText, styles.digitTextTop, { color: colors.digitColor }]}>
          {displayValue}
        </Text>
      </View>

      {/* Static background bottom */}
      <View style={[styles.halfBottom, { backgroundColor: colors.bottomBg }]}>
        <Text style={[styles.digitText, styles.digitTextBottom, { color: colors.digitColor }]}>
          {displayValue}
        </Text>
      </View>

      {/* Animated top flap */}
      <Animated.View style={[styles.flapTop, topFlapStyle, { backgroundColor: colors.topBg }]}>
        <Text style={[styles.digitText, styles.digitTextTop, { color: colors.digitColor }]}>
          {prevValueRef.current}
        </Text>
      </Animated.View>

      {/* Animated bottom flap */}
      <Animated.View style={[styles.flapBottom, bottomFlapStyle, { backgroundColor: colors.bottomBg }]}>
        <Text style={[styles.digitText, styles.digitTextBottom, { color: colors.digitColor }]}>
          {nextValue}
        </Text>
      </Animated.View>

      {/* Center line */}
      <View style={[styles.centerLine, { backgroundColor: colors.centerLine }]} />

      {/* Rivets */}
      <View style={[styles.rivetLeft, { backgroundColor: colors.rivetBg }]} />
      <View style={[styles.rivetRight, { backgroundColor: colors.rivetBg }]} />
    </View>
  );
};

const FlapColon = ({ light = false }: { light?: boolean }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const blink = () => {
      opacity.value = withSequence(
        withTiming(0.3, { duration: 500 }),
        withTiming(1, { duration: 500 })
      );
    };

    const interval = setInterval(blink, 1000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.colon, { color: light ? '#1a1a1a' : '#e8e8e8' }, animatedStyle]}>
      :
    </Animated.Text>
  );
};

export default function FlapClock({ theme = 'dark', showSeconds = true }: FlapClockProps) {
  const [time, setTime] = useState({
    h0: '0', h1: '0',
    m0: '0', m1: '0',
    s0: '0', s1: '0',
  });
  const [changingDigits, setChangingDigits] = useState<Set<string>>(new Set());
  const prevTimeRef = useRef({ h0: '0', h1: '0', m0: '0', m1: '0', s0: '0', s1: '0' });

  const isLight = theme === 'light';

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
        setTimeout(() => setChangingDigits(new Set()), 350);
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

  const containerBg = isLight
    ? 'linear-gradient(180deg, #f5f5f5 0%, #e8e8e8 100%)'
    : 'linear-gradient(180deg, #2c2c2c 0%, #1a1a1a 100%)';

  return (
    <View style={styles.container}>
      <View style={[
        styles.clockWrapper,
        {
          backgroundColor: isLight ? '#f0f0f0' : '#222',
          shadowColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.5)',
        }
      ]}>
        <View style={styles.clockRow}>
          <SplitFlapDigit value={time.h0} isChanging={changingDigits.has('h0')} light={isLight} />
          <SplitFlapDigit value={time.h1} isChanging={changingDigits.has('h1')} light={isLight} />
          <FlapColon light={isLight} />
          <SplitFlapDigit value={time.m0} isChanging={changingDigits.has('m0')} light={isLight} />
          <SplitFlapDigit value={time.m1} isChanging={changingDigits.has('m1')} light={isLight} />
          {showSeconds && (
            <>
              <FlapColon light={isLight} />
              <SplitFlapDigit value={time.s0} isChanging={changingDigits.has('s0')} light={isLight} />
              <SplitFlapDigit value={time.s1} isChanging={changingDigits.has('s1')} light={isLight} />
            </>
          )}
        </View>
      </View>

      {/* Date display */}
      <Text style={[styles.dateText, { color: isLight ? '#666' : '#999' }]}>
        {formatDate()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  clockWrapper: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitWrapper: {
    width: 40,
    height: 60,
    borderRadius: 6,
    marginHorizontal: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  halfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  halfBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  flapTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backfaceVisibility: 'hidden',
    zIndex: 5,
  },
  flapBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backfaceVisibility: 'hidden',
    zIndex: 4,
  },
  digitText: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: -1,
  },
  digitTextTop: {
    lineHeight: 60,
    transform: [{ translateY: 15 }],
  },
  digitTextBottom: {
    lineHeight: 60,
    transform: [{ translateY: -15 }],
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 3,
    marginTop: -1.5,
    zIndex: 10,
  },
  rivetLeft: {
    position: 'absolute',
    top: '50%',
    left: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
    zIndex: 20,
  },
  rivetRight: {
    position: 'absolute',
    top: '50%',
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
    zIndex: 20,
  },
  colon: {
    fontSize: 44,
    fontWeight: '900',
    marginHorizontal: 5,
  },
  dateText: {
    marginTop: 20,
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
});
