import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Volume2 } from 'lucide-react-native';
import { soundManager, ALARM_SOUNDS } from '@/services/soundService';

interface SoundPickerProps {
  selectedSound: string;
  onSoundSelect: (sound: string) => void;
  onCancel: () => void;
}

export const SoundPicker: React.FC<SoundPickerProps> = ({
  selectedSound,
  onSoundSelect,
  onCancel,
}) => {
  const [playingSound, setPlayingSound] = useState<string | null>(null);


  const playSound = async (soundId: string) => {
    if (playingSound === soundId) {
      setPlayingSound(null);
      return;
    }

    setPlayingSound(soundId);
    
    try {
      await soundManager.previewSound(soundId);
    } catch (error) {
      console.error('Erreur lors de la lecture du son:', error);
    }
    
    setTimeout(() => setPlayingSound(null), 1000);
  };

  const handleSelect = (soundId: string) => {
    setPlayingSound(null);
    onSoundSelect(soundId);
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Sons d'alarme</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.soundsList}>
        {ALARM_SOUNDS.map((sound) => (
          <View key={sound.id} style={styles.soundItem}>
            <TouchableOpacity
              style={[
                styles.soundOption,
                selectedSound === sound.id && styles.soundOptionSelected
              ]}
              onPress={() => handleSelect(sound.id)}
            >
              <View style={styles.soundInfo}>
                <Text style={[
                  styles.soundName,
                  selectedSound === sound.id && styles.soundNameSelected
                ]}>
                  {sound.name}
                </Text>
                <Text style={styles.soundDescription}>{sound.description}</Text>
              </View>
              
              {selectedSound === sound.id && (
                <View style={styles.selectedIndicator} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => playSound(sound.id)}
            >
              {playingSound === sound.id ? (
                <Volume2 size={20} color="#8b5cf6" />
              ) : (
                <Play size={20} color="#9ca3af" />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Appuyez sur le bouton lecture pour tester un son
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  soundsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  soundOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  soundOptionSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  soundInfo: {
    flex: 1,
  },
  soundName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  soundNameSelected: {
    color: '#8b5cf6',
  },
  soundDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});