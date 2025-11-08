import * as Brightness from 'expo-brightness';
import { Platform } from 'react-native';

class BrightnessManager {
  private originalBrightness: number | null = null;
  private isManaging = false;

  async initialize() {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Brightness.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission de luminosité refusée');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la luminosité:', error);
      return false;
    }
  }

  async setBrightness(level: number, saveOriginal: boolean = true): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        console.log('Brightness control not available on web');
        return;
      }

      if (saveOriginal && !this.isManaging) {
        this.originalBrightness = await Brightness.getBrightnessAsync();
        this.isManaging = true;
      }

      const clampedLevel = Math.max(0, Math.min(1, level));
      await Brightness.setBrightnessAsync(clampedLevel);
    } catch (error) {
      console.error('Erreur lors du réglage de la luminosité:', error);
    }
  }

  async setBrightnessFade(targetLevel: number, duration: number = 2000): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      const currentBrightness = await Brightness.getBrightnessAsync();
      const steps = 30;
      const stepDuration = duration / steps;
      const brightnessDiff = targetLevel - currentBrightness;

      for (let i = 1; i <= steps; i++) {
        const newBrightness = currentBrightness + (brightnessDiff * i) / steps;
        await this.setBrightness(newBrightness, i === 1);
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    } catch (error) {
      console.error('Erreur lors du fade de luminosité:', error);
    }
  }

  async restoreOriginalBrightness(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      if (this.originalBrightness !== null) {
        await Brightness.setBrightnessAsync(this.originalBrightness);
        this.originalBrightness = null;
        this.isManaging = false;
      }
    } catch (error) {
      console.error('Erreur lors de la restauration de la luminosité:', error);
    }
  }

  async setSystemBrightnessMode(): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      await Brightness.useSystemBrightnessAsync();
      this.isManaging = false;
    } catch (error) {
      console.error('Erreur lors de la restauration du mode système:', error);
    }
  }
}

export const brightnessManager = new BrightnessManager();
