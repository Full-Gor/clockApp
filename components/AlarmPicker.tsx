import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Play, Volume2, Plus, Trash2, Keyboard as KeyboardIcon, Clock } from 'lucide-react-native';
import { soundManager, SoundOption } from '@/services/soundService';

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [availableSounds, setAvailableSounds] = useState<SoundOption[]>([]);
  const [useKeyboardInput, setUseKeyboardInput] = useState(false);
  const [hoursInput, setHoursInput] = useState(selectedTime.getHours().toString().padStart(2, '0'));
  const [minutesInput, setMinutesInput] = useState(selectedTime.getMinutes().toString().padStart(2, '0'));

  // Charger les sons disponibles au montage du composant
  useEffect(() => {
    loadSounds();
  }, []);

  const loadSounds = async () => {
    const sounds = await soundManager.getAllSounds();
    setAvailableSounds(sounds);
  };

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

    setTimeout(() => setPlayingSound(null), 3000);
  };

  const addCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Retirer l'extension

      await soundManager.addCustomSound(fileName, file.uri);
      await loadSounds();

      Alert.alert('Succès', `Le son "${fileName}" a été ajouté !`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du son:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter ce fichier audio');
    }
  };

  const deleteCustomSound = async (soundId: string, soundName: string) => {
    Alert.alert(
      'Supprimer le son',
      `Voulez-vous vraiment supprimer "${soundName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await soundManager.removeCustomSound(soundId);
            await loadSounds();
            // Si c'était le son sélectionné, choisir le son par défaut
            if (selectedSound === soundId) {
              setSelectedSound('classic');
            }
          },
        },
      ]
    );
  };

  const handleHoursChange = (text: string) => {
    // Permettre seulement les chiffres et limiter à 2 caractères
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setHoursInput(cleaned);

    if (cleaned.length === 2) {
      const hours = parseInt(cleaned);
      if (hours >= 0 && hours <= 23) {
        const newTime = new Date(selectedTime);
        newTime.setHours(hours);
        setSelectedTime(newTime);
      }
    }
  };

  const handleMinutesChange = (text: string) => {
    // Permettre seulement les chiffres et limiter à 2 caractères
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 2);
    setMinutesInput(cleaned);

    if (cleaned.length === 2) {
      const minutes = parseInt(cleaned);
      if (minutes >= 0 && minutes <= 59) {
        const newTime = new Date(selectedTime);
        newTime.setMinutes(minutes);
        setSelectedTime(newTime);
      }
    }
  };

  const toggleInputMode = () => {
    if (useKeyboardInput) {
      // Valider et formater les inputs avant de changer de mode
      const hours = Math.min(Math.max(parseInt(hoursInput) || 0, 0), 23);
      const minutes = Math.min(Math.max(parseInt(minutesInput) || 0, 0), 59);
      const newTime = new Date(selectedTime);
      newTime.setHours(hours, minutes);
      setSelectedTime(newTime);
      setHoursInput(hours.toString().padStart(2, '0'));
      setMinutesInput(minutes.toString().padStart(2, '0'));
      Keyboard.dismiss();
    }
    setUseKeyboardInput(!useKeyboardInput);
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Heure</Text>
            <TouchableOpacity
              style={styles.inputModeButton}
              onPress={toggleInputMode}
            >
              {useKeyboardInput ? (
                <Clock size={18} color="#8b5cf6" />
              ) : (
                <KeyboardIcon size={18} color="#8b5cf6" />
              )}
              <Text style={styles.inputModeButtonText}>
                {useKeyboardInput ? 'Sélecteur' : 'Clavier'}
              </Text>
            </TouchableOpacity>
          </View>

          {useKeyboardInput ? (
            // Mode saisie numérique
            <View style={styles.keyboardInputContainer}>
              <View style={styles.timeInputRow}>
                <TextInput
                  style={styles.timeInput}
                  value={hoursInput}
                  onChangeText={handleHoursChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#6b7280"
                  selectTextOnFocus
                />
                <Text style={styles.timeSeparator}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={minutesInput}
                  onChangeText={handleMinutesChange}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="00"
                  placeholderTextColor="#6b7280"
                  selectTextOnFocus
                />
              </View>
              <Text style={styles.timeInputHint}>
                Format 24h • Heures: 00-23 • Minutes: 00-59
              </Text>
            </View>
          ) : (
            // Mode sélecteur natif
            <>
              <TouchableOpacity
                style={styles.timePickerContainer}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeDisplay}>
                  {selectedTime.getHours().toString().padStart(2, '0')}:{selectedTime.getMinutes().toString().padStart(2, '0')}
                </Text>
                <Text style={styles.timePickerHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      setSelectedTime(date);
                      setHoursInput(date.getHours().toString().padStart(2, '0'));
                      setMinutesInput(date.getMinutes().toString().padStart(2, '0'));
                    }
                  }}
                  textColor="#fff"
                />
              )}
            </>
          )}
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
          <View style={styles.soundHeader}>
            <Text style={styles.sectionTitle}>Son d'alarme</Text>
            <TouchableOpacity
              style={styles.addSoundButton}
              onPress={addCustomSound}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.addSoundText}>Ajouter MP3</Text>
            </TouchableOpacity>
          </View>

          {availableSounds.map((sound) => (
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
                    {sound.isCustom && ' ⭐'}
                  </Text>
                  <Text style={styles.soundDescription}>{sound.description}</Text>
                </View>

                {selectedSound === sound.id && (
                  <View style={styles.selectedIndicator} />
                )}
              </TouchableOpacity>

              <View style={styles.soundActions}>
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

                {sound.isCustom && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteCustomSound(sound.id, sound.name)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  inputModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  inputModeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  keyboardInputContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  timeInput: {
    width: 80,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  timeInputHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  timePickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  timePickerHint: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
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
  soundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addSoundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addSoundText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  soundItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  soundActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});