import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';

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
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (isChanging) {
      // Exit animation - old value goes up
      translateY.value = withTiming(-40, { duration: 250, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 250 });
      scale.value = withTiming(0.7, { duration: 250 });

      // Après sortie, mettre le nouveau chiffre et le faire entrer
      setTimeout(() => {
        setDisplayValue(value); // Le nouveau chiffre est déjà visible quand il monte
        translateY.value = 40;
        opacity.value = 0;
        scale.value = 0.7;

        translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        opacity.value = withTiming(1, { duration: 300 });
        scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      }, 250);
    } else {
      // Pas de changement, juste mettre à jour la valeur
      setDisplayValue(value);
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
        <Text style={styles.digitText}>{displayValue}</Text>
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
    paddingVertical: 30,
  },
  clockWrapper: {
    backgroundColor: 'rgba(10, 21, 32, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.4)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitContainer: {
    width: 38,
    height: 55,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
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
    fontSize: 36,
    fontWeight: '300',
    color: '#00f5ff',
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 30,
    fontWeight: '300',
    color: '#00f5ff',
    textShadowColor: '#00f5ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginHorizontal: 3,
  },
  dateText: {
    marginTop: 20,
    fontSize: 14,
    color: 'rgba(0, 245, 255, 0.6)',
    letterSpacing: 1,
    textTransform: 'capitalize',
  },
});
