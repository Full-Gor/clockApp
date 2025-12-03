import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { soundManager } from './soundService';
import { brightnessManager } from './brightnessService';
import { ttsManager } from './ttsService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false, // On gère le son manuellement
    shouldSetBadge: true, // Afficher badge sur l'icône
  }),
});

// Fonction pour mettre à jour le badge
export const updateBadgeCount = async (count: number) => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du badge:', error);
  }
};

// Fonction pour réinitialiser le badge
export const clearBadge = async () => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du badge:', error);
  }
};

export const initializeNotifications = async () => {
  // Demander la permission pour les notifications
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Permission de notification refusée');
    return;
  }

  // Configuration pour Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'Alarmes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }
};

interface AlarmData {
  id: string;
  time: string;
  label: string;
  days: string[];
  sound: string;
  useFadeIn?: boolean;
  fadeInDuration?: number;
  voiceMessage?: string;
  useVoiceNotification?: boolean;
  voiceLoop?: boolean;
  voiceLoopInterval?: number;
  brightnessLevel?: number;
  useBrightnessControl?: boolean;
}

export const scheduleAlarmNotification = async (alarm: AlarmData) => {
  try {
    // Annuler les notifications existantes pour cette alarme
    await cancelNotification(alarm.id);

    const [hours, minutes] = alarm.time.split(':').map(Number);
    const now = new Date();

    // Si c'est tous les jours ou des jours spécifiques
    if (alarm.days.length === 7 || alarm.days.length === 0) {
      // Alarme quotidienne
      const trigger = new Date();
      trigger.setHours(hours, minutes, 0, 0);

      // Si l'heure est déjà passée aujourd'hui ou dans les 60 prochaines secondes, programmer pour demain
      // Cela évite les déclenchements immédiats lors de la création d'alarme
      const bufferMs = 60000; // 60 secondes de marge
      if (trigger.getTime() <= now.getTime() + bufferMs) {
        trigger.setDate(trigger.getDate() + 1);
      }

      await Notifications.scheduleNotificationAsync({
        identifier: alarm.id,
        content: {
          title: '⏰ Alarme',
          body: alarm.label || 'Il est temps de se réveiller !',
          sound: 'default',
          categoryIdentifier: 'alarm',
          data: {
            sound: alarm.sound,
            alarmId: alarm.id,
            useFadeIn: alarm.useFadeIn,
            fadeInDuration: alarm.fadeInDuration,
            voiceMessage: alarm.voiceMessage,
            useVoiceNotification: alarm.useVoiceNotification,
            voiceLoop: alarm.voiceLoop,
            voiceLoopInterval: alarm.voiceLoopInterval,
            brightnessLevel: alarm.brightnessLevel,
            useBrightnessControl: alarm.useBrightnessControl,
          },
        },
        trigger: {
          repeats: true,
          hour: hours,
          minute: minutes,
        },
      });
    } else {
      // Alarme pour des jours spécifiques
      const weekDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      for (const day of alarm.days) {
        const dayIndex = weekDays.indexOf(day);
        if (dayIndex !== -1) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${alarm.id}_${dayIndex}`,
            content: {
              title: '⏰ Alarme',
              body: alarm.label || 'Il est temps de se réveiller !',
              sound: 'default',
              categoryIdentifier: 'alarm',
              data: {
                sound: alarm.sound,
                alarmId: alarm.id,
                useFadeIn: alarm.useFadeIn,
                fadeInDuration: alarm.fadeInDuration,
                voiceMessage: alarm.voiceMessage,
                useVoiceNotification: alarm.useVoiceNotification,
                voiceLoop: alarm.voiceLoop,
                voiceLoopInterval: alarm.voiceLoopInterval,
                brightnessLevel: alarm.brightnessLevel,
                useBrightnessControl: alarm.useBrightnessControl,
              },
            },
            trigger: {
              repeats: true,
              weekday: dayIndex === 0 ? 1 : dayIndex + 1, // Expo utilise 1 pour dimanche
              hour: hours,
              minute: minutes,
            },
          });
        }
      }
    }

    console.log(`Alarme programmée: ${alarm.label} à ${alarm.time}`);
  } catch (error) {
    console.error('Erreur lors de la programmation de l\'alarme:', error);
  }
};

export const cancelNotification = async (alarmId: string) => {
  try {
    // Annuler la notification principale
    await Notifications.cancelScheduledNotificationAsync(alarmId);
    
    // Annuler les notifications pour chaque jour de la semaine
    for (let i = 0; i < 7; i++) {
      await Notifications.cancelScheduledNotificationAsync(`${alarmId}_${i}`);
    }
    
    console.log(`Notifications annulées pour l'alarme: ${alarmId}`);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
};

export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Notifications programmées:', notifications);
    return notifications;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return [];
  }
};

// Fonction pour arrêter complètement une alarme en cours
export const stopCurrentAlarm = async () => {
  try {
    // Arrêter le son
    await soundManager.stopCurrentAlarm();

    // Arrêter la synthèse vocale
    await ttsManager.stop();

    // Restaurer la luminosité originale
    await brightnessManager.restoreOriginalBrightness();

    console.log('Alarme arrêtée complètement');
  } catch (error) {
    console.error('Erreur lors de l\'arrêt de l\'alarme:', error);
  }
};

// Fonction pour déclencher une alarme avec toutes ses fonctionnalités
export const triggerAlarm = async (notificationData: any) => {
  const data = notificationData || {};
  const soundId = data.sound || 'classic';
  const useFadeIn = data.useFadeIn || false;
  const fadeInDuration = data.fadeInDuration || 5;
  const useBrightnessControl = data.useBrightnessControl || false;
  const brightnessLevel = data.brightnessLevel || 1.0;
  const useVoiceNotification = data.useVoiceNotification || false;
  const voiceMessage = data.voiceMessage || '';
  const voiceLoop = data.voiceLoop || false;
  const voiceLoopInterval = data.voiceLoopInterval || 10;

  try {
    // 1. Contrôle de la luminosité
    if (useBrightnessControl) {
      await brightnessManager.initialize();
      await brightnessManager.setBrightnessFade(brightnessLevel, 2000);
    }

    // 2. Jouer le son avec ou sans fade-in
    if (useFadeIn) {
      await soundManager.playAlarmWithFadeIn(soundId, fadeInDuration * 1000);
    } else {
      await soundManager.playAlarmSound(soundId);
    }

    // 3. Notification vocale
    if (useVoiceNotification && voiceMessage) {
      if (voiceLoop) {
        await ttsManager.speakLoop(voiceMessage, voiceLoopInterval * 1000);
      } else {
        await ttsManager.speak(voiceMessage);
      }
    }
  } catch (error) {
    console.error('Erreur lors du déclenchement de l\'alarme:', error);
  }
};