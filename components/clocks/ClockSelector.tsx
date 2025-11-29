import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, X, Check, Sparkles, Layers, Zap, Sun, Moon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ClockType = 'digital' | 'holographic' | 'fluid' | 'flap-dark' | 'flap-light';

interface ClockOption {
  id: ClockType;
  name: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
  preview: string;
}

const clockOptions: ClockOption[] = [
  {
    id: 'digital',
    name: 'Digitale',
    description: 'Horloge mondiale classique',
    icon: <Clock size={24} color="#8b5cf6" />,
    colors: ['#8b5cf6', '#7c3aed'],
    preview: '12:34:56',
  },
  {
    id: 'holographic',
    name: 'Holographique',
    description: 'Horloge HUD futuriste avec anneaux',
    icon: <Sparkles size={24} color="#00f5ff" />,
    colors: ['#0a192f', '#051015'],
    preview: 'HUD',
  },
  {
    id: 'fluid',
    name: 'Fluide',
    description: 'Style cyan avec animations fluides',
    icon: <Zap size={24} color="#00f5ff" />,
    colors: ['#0a1520', '#051015'],
    preview: 'CYAN',
  },
  {
    id: 'flap-dark',
    name: 'Flip-Flap Sombre',
    description: 'Style rétro split-flap sombre',
    icon: <Layers size={24} color="#e8e8e8" />,
    colors: ['#2c2c2c', '#1a1a1a'],
    preview: 'FLAP',
  },
  {
    id: 'flap-light',
    name: 'Flip-Flap Clair',
    description: 'Style rétro split-flap clair',
    icon: <Sun size={24} color="#1a1a1a" />,
    colors: ['#f5f5f5', '#e8e8e8'],
    preview: 'FLAP',
  },
];

interface ClockSelectorProps {
  visible: boolean;
  onClose: () => void;
  selectedClock: ClockType;
  onSelect: (clockType: ClockType) => void;
}

export default function ClockSelector({
  visible,
  onClose,
  selectedClock,
  onSelect,
}: ClockSelectorProps) {
  const handleSelect = async (clockType: ClockType) => {
    onSelect(clockType);
    try {
      await AsyncStorage.setItem('selectedClockType', clockType);
    } catch (error) {
      console.error('Error saving clock preference:', error);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Choisir une horloge</Text>
          <View style={{ width: 40 }} />
        </View>

        <Text style={styles.subtitle}>
          Sélectionnez le style d'horloge qui vous convient
        </Text>

        {/* Clock Options */}
        <ScrollView
          style={styles.optionsList}
          contentContainerStyle={styles.optionsContent}
          showsVerticalScrollIndicator={false}
        >
          {clockOptions.map((option) => {
            const isSelected = selectedClock === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelect(option.id)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={option.colors}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.optionIcon}>
                      {option.icon}
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{option.name}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Check size={20} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Mini Preview */}
                  <View style={styles.previewContainer}>
                    <Text style={[
                      styles.previewText,
                      option.id.includes('light') ? styles.previewTextDark : styles.previewTextLight
                    ]}>
                      {option.preview}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Votre choix sera sauvegardé automatiquement
          </Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

// Export a hook to manage clock selection
export function useClockSelection() {
  const [selectedClock, setSelectedClock] = useState<ClockType>('digital');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClockPreference();
  }, []);

  const loadClockPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('selectedClockType');
      if (saved && isValidClockType(saved)) {
        setSelectedClock(saved as ClockType);
      }
    } catch (error) {
      console.error('Error loading clock preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValidClockType = (type: string): type is ClockType => {
    return ['digital', 'holographic', 'fluid', 'flap-dark', 'flap-light'].includes(type);
  };

  return { selectedClock, setSelectedClock, loading };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  optionCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#8b5cf6',
  },
  optionGradient: {
    padding: 16,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  previewTextLight: {
    color: '#fff',
    textShadowColor: 'rgba(100, 200, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  previewTextDark: {
    color: '#333',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
