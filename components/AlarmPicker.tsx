import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Play, Volume2 } from 'lucide-react-native';
import { soundManager, ALARM_SOUNDS } from '@/services/soundService';

interface AlarmPickerProps {
  alarm?: {
    time: string;
    label: string;
    days: string[];
    sound: string;
    enabled: boolean;
  } | null;
  onSave: (alarm: {
    time: string;
    label: string;
    days: string[];
    sound: string;
    enabled: boolean;
  }) => void;
  onCancel: () => void;
}

export const AlarmPicker: React.FC<AlarmPickerProps> = ({
  alarm,
  onSave,
  onCancel,
}) => {
  const [selectedTime, setSelectedTime] = useState(() => {
    if (alarm?.time) {
      const [hours, minutes] = alarm.time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    }
    return new Date();
  });
  
  const [label, setLabel] = useState(alarm?.label || 'Réveil');
  const [selectedDays, setSelectedDays] = useState<string[]>(alarm?.days || []);
  const [selectedSound, setSelectedSound] = useState(alarm?.sound || 'classic');
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const weekDays = [
    'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
  ];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
    
    console.log('Saving alarm with data:', {
      time: timeString,
      label: label.trim() || 'Réveil',
      days: selectedDays,
      sound: selectedSound,
      enabled: true,
    });
    
    const alarmData = {
      time: timeString,
      label: label.trim() || 'Réveil',
      days: selectedDays,
      sound: selectedSound,
      enabled: true,
    };
    
    onSave(alarmData);
  };

  const handleCancel = () => {
    console.log('Cancelling alarm picker');
    onCancel();
  };

  const selectAllWeekdays = () => {
    setSelectedDays(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']);
  };

  const selectAllDays = () => {
    setSelectedDays([...weekDays]);
  };

  const clearDays = () => {
    setSelectedDays([]);
  };

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

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {alarm ? 'Modifier l\'alarme' : 'Nouvelle alarme'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heure</Text>
          <View style={styles.timePickerContainer}>
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={(event, date) => {
                if (date) setSelectedTime(date);
              }}
              textColor="#fff"
              style={styles.timePicker}
            />
          </View>
        </View>

        {/* Label Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom de l'alarme</Text>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder="Réveil, Rendez-vous..."
            placeholderTextColor="#9ca3af"
            maxLength={50}
          />
        </View>

        {/* Days Selection */}
        <View style={styles.section}>
          <View style={styles.daysHeader}>
            <Text style={styles.sectionTitle}>Répétition</Text>
            <View style={styles.dayQuickActions}>
              <TouchableOpacity onPress={selectAllWeekdays}>
                <Text style={styles.quickActionText}>Semaine</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectAllDays}>
                <Text style={styles.quickActionText}>Tous</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={clearDays}>
                <Text style={styles.quickActionText}>Aucun</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.daysContainer}>
            {weekDays.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[
                  styles.dayButtonText,
                  selectedDays.includes(day) && styles.dayButtonTextSelected
                ]}>
                  {day.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {selectedDays.length === 0 && (
            <Text style={styles.daysInfo}>Une seule fois</Text>
          )}
          {selectedDays.length === 7 && (
            <Text style={styles.daysInfo}>Tous les jours</Text>
          )}
          {selectedDays.length > 0 && selectedDays.length < 7 && (
            <Text style={styles.daysInfo}>
              {selectedDays.join(', ')}
            </Text>
          )}
        </View>

        {/* Sound Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son d'alarme</Text>
          {ALARM_SOUNDS.map((sound) => (
            <View key={sound.id} style={styles.soundItem}>
              <TouchableOpacity
                style={[
                  styles.soundOption,
                  selectedSound === sound.id && styles.soundOptionSelected
                ]}
                onPress={() => setSelectedSound(sound.id)}
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
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  content: {
    flex: 1,
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
    color: '#ef4444',
  },
  saveButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  timePickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  timePicker: {
    width: 200,
    height: 120,
  },
  labelInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayQuickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#a78bfa',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  daysInfo: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
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
});