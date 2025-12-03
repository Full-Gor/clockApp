import * as Speech from 'expo-speech';

class TTSManager {
  private isSpeaking = false;
  private loopInterval: NodeJS.Timeout | null = null;

  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    try {
      if (this.isSpeaking) {
        await this.stop();
      }

      this.isSpeaking = true;

      await Speech.speak(text, {
        language: 'fr-FR',
        pitch: 1.0,
        rate: 0.9,
        ...options,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      console.error('Erreur lors de la synthèse vocale:', error);
      this.isSpeaking = false;
    }
  }

  async speakLoop(text: string, intervalMs: number = 5000): Promise<void> {
    try {
      // Arrêter la boucle précédente
      this.stopLoop();

      // Parler immédiatement
      await this.speak(text);

      // Configurer la boucle
      this.loopInterval = setInterval(async () => {
        if (!this.isSpeaking) {
          await this.speak(text);
        }
      }, intervalMs);
    } catch (error) {
      console.error('Erreur lors de la boucle TTS:', error);
    }
  }

  stopLoop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  async stop(): Promise<void> {
    try {
      this.stopLoop();
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la synthèse vocale:', error);
    }
  }

  async pause(): Promise<void> {
    try {
      await Speech.pause();
    } catch (error) {
      console.error('Erreur lors de la pause de la synthèse vocale:', error);
    }
  }

  async resume(): Promise<void> {
    try {
      await Speech.resume();
    } catch (error) {
      console.error('Erreur lors de la reprise de la synthèse vocale:', error);
    }
  }

  getAvailableVoices(): Promise<Speech.Voice[]> {
    return Speech.getAvailableVoicesAsync();
  }

  isSpeakingNow(): boolean {
    return this.isSpeaking;
  }
}

export const ttsManager = new TTSManager();
