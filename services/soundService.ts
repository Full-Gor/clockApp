import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface SoundOption {
  id: string;
  name: string;
  description: string;
  frequency?: number;
  pattern?: number[];
}

export const ALARM_SOUNDS: SoundOption[] = [
  {
    id: 'classic',
    name: 'Classique',
    description: 'Son d\'alarme traditionnel',
    frequency: 800,
    pattern: [0, 500, 200, 500, 200, 500],
  },
  {
    id: 'gentle',
    name: 'Doux',
    description: 'Réveil en douceur',
    frequency: 400,
    pattern: [0, 200, 100, 200, 100, 200],
  },
  {
    id: 'bell',
    name: 'Cloche',
    description: 'Son de cloche claire',
    frequency: 1000,
    pattern: [0, 300, 150, 300, 150, 300],
  },
  {
    id: 'chime',
    name: 'Carillon',
    description: 'Carillon mélodieux',
    frequency: 600,
    pattern: [0, 150, 50, 150, 50, 150, 50, 150],
  },
  {
    id: 'beep',
    name: 'Bip',
    description: 'Bips répétés',
    frequency: 1200,
    pattern: [0, 100, 100, 100, 100, 100],
  },
];

class SoundManager {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation audio:', error);
    }
  }

  async createBeepSound(frequency: number = 800, duration: number = 500): Promise<Audio.Sound | null> {
    try {
      if (Platform.OS === 'web') {
        return this.createWebBeep(frequency, duration);
      }

      // Pour mobile, créer un son synthétique plus audible
      const { sound } = await Audio.Sound.createAsync(
        { uri: this.generateBeepDataUri(frequency, duration) },
        { 
          shouldPlay: false, 
          isLooping: false,
          volume: 1.0,
          rate: 1.0,
        }
      );
      
      return sound;
    } catch (error) {
      console.error('Erreur lors de la création du son:', error);
      return null;
    }
  }

  private createWebBeep(frequency: number, duration: number): any {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'square'; // Utiliser square wave pour un son plus audible
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      return {
        playAsync: async () => {
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration / 1000);
        },
        unloadAsync: async () => {
          oscillator.disconnect();
          gainNode.disconnect();
        }
      };
    }
    return null;
  }

  private generateBeepDataUri(frequency: number, duration: number): string {
    // Générer un data URI pour un son square wave plus audible
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration / 1000);
    const buffer = new ArrayBuffer(samples * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < samples; i++) {
      // Utiliser une onde carrée pour un son plus audible
      const time = i / sampleRate;
      const wave = Math.sin(2 * Math.PI * frequency * time) > 0 ? 0.5 : -0.5;
      const intSample = Math.floor(wave * 32767);
      view.setInt16(i * 2, intSample, true);
    }
    
    // Convertir en base64 (simplifié)
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
  }

  async playAlarmSound(soundId: string): Promise<void> {
    await this.initialize();
    
    const soundOption = ALARM_SOUNDS.find(s => s.id === soundId);
    if (!soundOption) return;

    try {
      // Jouer le son avec vibrations
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Créer et jouer le son avec un pattern
      if (soundOption.pattern) {
        for (let i = 0; i < soundOption.pattern.length; i += 2) {
          const delay = soundOption.pattern[i];
          const duration = soundOption.pattern[i + 1] || 500;
          
          setTimeout(async () => {
            const sound = await this.createBeepSound(soundOption.frequency || 800, duration);
            if (sound) {
              await sound.playAsync();
              setTimeout(async () => {
                try {
                  await sound.unloadAsync();
                } catch (error) {
                  console.error('Erreur lors du nettoyage du son:', error);
                }
              }, duration + 100);
            }
          }, delay);
        }
      } else {
        // Son simple
        const sound = await this.createBeepSound(soundOption.frequency || 800, 1000);
        if (sound) {
          await sound.playAsync();
          setTimeout(async () => {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.error('Erreur lors du nettoyage du son:', error);
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du son:', error);
      // Fallback sur les vibrations
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
  }

  async previewSound(soundId: string): Promise<void> {
    const soundOption = ALARM_SOUNDS.find(s => s.id === soundId);
    if (!soundOption) return;

    try {
      if (Platform.OS !== 'web') {
        // Utiliser le pattern de vibration pour la preview
        if (soundOption.pattern) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      // Jouer un court extrait du son avec pattern
      if (soundOption.pattern && soundOption.pattern.length >= 2) {
        const sound = await this.createBeepSound(soundOption.frequency || 800, 300);
        if (sound) {
          await sound.playAsync();
          setTimeout(async () => {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.error('Erreur lors du nettoyage du son preview:', error);
            }
          }, 500);
        }
      } else {
        // Son simple
        const sound = await this.createBeepSound(soundOption.frequency || 800, 300);
        if (sound) {
          await sound.playAsync();
          setTimeout(async () => {
            try {
              await sound.unloadAsync();
            } catch (error) {
              console.error('Erreur lors du nettoyage du son preview:', error);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la preview du son:', error);
    }
  }

  async cleanup(): Promise<void> {
    for (const [id, sound] of this.sounds) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Erreur lors du nettoyage du son ${id}:`, error);
      }
    }
    this.sounds.clear();
  }
}

export const soundManager = new SoundManager();