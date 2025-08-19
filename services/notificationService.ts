import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { soundManager } from './soundService';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Écouter les notifications reçues
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification reçue:', notification);
  
  // Jouer le son d'alarme personnalisé si c'est une alarme
  if (notification.request.content.categoryIdentifier === 'alarm') {
    const soundId = notification.request.content.data?.sound || 'classic';
    soundManager.playAlarmSound(soundId);
  }
});
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
      
      // Si l'heure est déjà passée aujourd'hui, programmer pour demain
      if (trigger <= now) {
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