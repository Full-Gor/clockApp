import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TimerPickerProps {
  onTimeSet: (hours: number, minutes: number, seconds: number) => void;
  onCancel: () => void;
  initialHours?: number;
  initialMinutes?: number;
  initialSeconds?: number;
}

export const TimerPicker: React.FC<TimerPickerProps> = ({
  onTimeSet,
  onCancel,
  initialHours = 0,
  initialMinutes = 1,
  initialSeconds = 0,
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  const handleSave = () => {
    onTimeSet(hours, minutes, seconds);
  };

  const renderPicker = (
    value: number,
    setValue: (value: number) => void,
    max: number,
    label: string
  ) => {
    const values = Array.from({ length: max + 1 }, (_, i) => i);
    
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <ScrollView
          style={styles.picker}
          showsVerticalScrollIndicator={false}
          contentOffset={{ x: 0, y: value * 50 }}
        >
          {values.map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.pickerItem,
                value === num && styles.pickerItemSelected
              ]}
              onPress={() => setValue(num)}
            >
              <Text style={[
                styles.pickerItemText,
                value === num && styles.pickerItemTextSelected
              ]}>
                {num.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelButton}>Annuler</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Définir la durée</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveButton}>OK</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickersContainer}>
        {renderPicker(hours, setHours, 23, 'Heures')}
        {renderPicker(minutes, setMinutes, 59, 'Minutes')}
        {renderPicker(seconds, setSeconds, 59, 'Secondes')}
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewLabel}>Durée sélectionnée</Text>
        <Text style={styles.previewTime}>
          {hours > 0 && `${hours}h `}
          {minutes > 0 && `${minutes}m `}
          {seconds > 0 && `${seconds}s`}
          {hours === 0 && minutes === 0 && seconds === 0 && '0s'}
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
    marginBottom: 40,
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
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  pickerContainer: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 16,
  },
  picker: {
    height: 200,
    width: 80,
  },
  pickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  pickerItemText: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: '300',
  },
  pickerItemTextSelected: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewLabel: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 8,
  },
  previewTime: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -1,
  },
});