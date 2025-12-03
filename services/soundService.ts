import { Audio, AVPlaybackSource } from 'expo-av';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SoundOption {
  id: string;
  name: string;
  description: string;
  fileUri?: string; // URI vers le fichier MP3 (local ou personnalisé)
  isCustom?: boolean;
  frequency?: number; // Fallback pour sons synthétiques
  pattern?: number[]; // Fallback pour sons synthétiques
}

// Sons par défaut - ils peuvent utiliser des fichiers ou des sons synthétiques
export const DEFAULT_ALARM_SOUNDS: SoundOption[] = [
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

export let ALARM_SOUNDS: SoundOption[] = [...DEFAULT_ALARM_SOUNDS];

class SoundManager {
  private sounds: Map<string, Audio.Sound> = new Map();
  private isInitialized = false;
  private customSoundsLoaded = false;
  private fadeInterval: NodeJS.Timeout | null = null;
  private currentAlarmSound: Audio.Sound | null = null;

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

      // Charger les sons personnalisés sauvegardés
      await this.loadCustomSounds();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation audio:', error);
    }
  }

  // Charger les sons personnalisés depuis AsyncStorage
  async loadCustomSounds() {
    try {
      const customSoundsJson = await AsyncStorage.getItem('customAlarmSounds');
      if (customSoundsJson) {
        const customSounds: SoundOption[] = JSON.parse(customSoundsJson);
        ALARM_SOUNDS = [...DEFAULT_ALARM_SOUNDS, ...customSounds];
        this.customSoundsLoaded = true;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sons personnalisés:', error);
    }
  }

  // Ajouter un son personnalisé
  async addCustomSound(name: string, fileUri: string): Promise<SoundOption> {
    const customSound: SoundOption = {
      id: `custom_${Date.now()}`,
      name: name,
      description: 'Son personnalisé',
      fileUri: fileUri,
      isCustom: true,
    };

    // Ajouter à la liste
    ALARM_SOUNDS.push(customSound);

    // Sauvegarder dans AsyncStorage
    await this.saveCustomSounds();

    return customSound;
  }

  // Supprimer un son personnalisé
  async removeCustomSound(soundId: string) {
    ALARM_SOUNDS = ALARM_SOUNDS.filter(s => s.id !== soundId);
    await this.saveCustomSounds();
  }

  // Sauvegarder les sons personnalisés
  private async saveCustomSounds() {
    try {
      const customSounds = ALARM_SOUNDS.filter(s => s.isCustom);
      await AsyncStorage.setItem('customAlarmSounds', JSON.stringify(customSounds));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des sons personnalisés:', error);
    }
  }

  // Obtenir tous les sons disponibles
  async getAllSounds(): Promise<SoundOption[]> {
    if (!this.customSoundsLoaded) {
      await this.loadCustomSounds();
    }
    return ALARM_SOUNDS;
  }

  async createBeepSound(frequency: number = 800, duration: number = 500): Promise<Audio.Sound | null> {
    try {
      if (Platform.OS === 'web') {
        return this.createWebBeep(frequency, duration);
      }

      // Sur mobile, ne pas utiliser les sons synthétiques (ne fonctionnent pas bien)
      // À la place, utiliser les vibrations uniquement
      console.log('Les sons synthétiques ne sont pas supportés sur mobile. Utilisez des fichiers MP3 personnalisés.');
      return null;
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
      // Si le son a un fichier MP3, l'utiliser
      if (soundOption.fileUri) {
        // Vibration pour signaler le démarrage
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        await this.playAudioFile(soundOption.fileUri, true);
      } else {
        // Pas de fichier MP3 : utiliser vibrations répétées
        if (Platform.OS !== 'web') {
          console.log(`Alarme "${soundOption.name}" : Pas de fichier audio. Utilisez "Ajouter MP3" pour ajouter un son personnalisé.`);

          // Vibrations répétées pour simuler une alarme
          const vibratePattern = async () => {
            for (let i = 0; i < 10; i++) {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          };
          vibratePattern();
        } else {
          // Sur web, essayer le son synthétique
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
          }
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

  // Jouer un fichier audio MP3
  private async playAudioFile(fileUri: string, loop: boolean = false): Promise<void> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        {
          shouldPlay: true,
          isLooping: loop,
          volume: 1.0,
        }
      );

      // Stocker le son pour pouvoir l'arrêter plus tard
      this.sounds.set('current_alarm', sound);

      // Si ce n'est pas en boucle, nettoyer après 30 secondes
      if (!loop) {
        setTimeout(async () => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
            this.sounds.delete('current_alarm');
          } catch (error) {
            console.error('Erreur lors du nettoyage du son:', error);
          }
        }, 30000);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier audio:', error);
      throw error;
    }
  }

  async previewSound(soundId: string): Promise<void> {
    await this.initialize();

    const soundOption = ALARM_SOUNDS.find(s => s.id === soundId);
    if (!soundOption) return;

    try {
      // Si le son a un fichier MP3, l'utiliser pour la preview
      if (soundOption.fileUri) {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: soundOption.fileUri },
          {
            shouldPlay: true,
            isLooping: false,
            volume: 1.0,
          }
        );

        // Arrêter après 3 secondes
        setTimeout(async () => {
          try {
            await sound.stopAsync();
            await sound.unloadAsync();
          } catch (error) {
            console.error('Erreur lors du nettoyage du son preview:', error);
          }
        }, 3000);
      } else {
        // Pas de fichier MP3 : juste vibration sur mobile
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          console.log(`Son "${soundOption.name}" : Ajoutez un fichier MP3 personnalisé pour entendre le son`);
        } else {
          // Sur web, essayer le son synthétique
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
      }
    } catch (error) {
      console.error('Erreur lors de la preview du son:', error);
    }
  }

  // Jouer une alarme avec volume progressif
  async playAlarmWithFadeIn(soundId: string, fadeDuration: number = 5000): Promise<void> {
    await this.initialize();

    const soundOption = ALARM_SOUNDS.find(s => s.id === soundId);
    if (!soundOption) return;

    try {
      if (soundOption.fileUri) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: soundOption.fileUri },
          {
            shouldPlay: true,
            isLooping: true,
            volume: 0, // Commencer à volume 0
          }
        );

        this.currentAlarmSound = sound;
        this.sounds.set('current_alarm', sound);

        // Augmenter progressivement le volume
        const steps = 50;
        const stepDuration = fadeDuration / steps;
        let currentStep = 0;

        this.fadeInterval = setInterval(async () => {
          currentStep++;
          const volume = currentStep / steps;

          try {
            await sound.setVolumeAsync(Math.min(volume, 1));
          } catch (error) {
            console.error('Erreur lors du réglage du volume:', error);
          }

          if (currentStep >= steps) {
            if (this.fadeInterval) {
              clearInterval(this.fadeInterval);
              this.fadeInterval = null;
            }
          }
        }, stepDuration);
      } else {
        // Fallback sans fade-in
        await this.playAlarmSound(soundId);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture du son avec fade-in:', error);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    }
  }

  // Arrêter le son en cours
  async stopCurrentAlarm(): Promise<void> {
    try {
      // Arrêter le fade-in en cours
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }

      // Arrêter le son actuel
      if (this.currentAlarmSound) {
        await this.currentAlarmSound.stopAsync();
        await this.currentAlarmSound.unloadAsync();
        this.currentAlarmSound = null;
      }

      // Nettoyer les sons stockés
      const alarmSound = this.sounds.get('current_alarm');
      if (alarmSound) {
        try {
          await alarmSound.stopAsync();
          await alarmSound.unloadAsync();
        } catch (error) {
          // Ignorer les erreurs de nettoyage
        }
        this.sounds.delete('current_alarm');
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt du son:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.stopCurrentAlarm();

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