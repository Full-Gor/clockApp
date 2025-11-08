import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit3, Check } from 'lucide-react-native';

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
  const [editingField, setEditingField] = useState<'hours' | 'minutes' | 'seconds' | null>(null);
  const [tempValue, setTempValue] = useState('');

  const handleSave = () => {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      return; // Ne pas sauvegarder si tout est à 0
    }
    onTimeSet(hours, minutes, seconds);
  };

  const handleFieldEdit = (field: 'hours' | 'minutes' | 'seconds', currentValue: number) => {
    setEditingField(field);
    setTempValue(currentValue.toString());
  };

  const handleFieldSave = () => {
    if (editingField && tempValue !== '') {
      const value = parseInt(tempValue) || 0;
      let clampedValue = value;

      switch (editingField) {
        case 'hours':
          clampedValue = Math.min(Math.max(value, 0), 99);
          setHours(clampedValue);
          break;
        case 'minutes':
          clampedValue = Math.min(Math.max(value, 0), 59);
          setMinutes(clampedValue);
          break;
        case 'seconds':
          clampedValue = Math.min(Math.max(value, 0), 59);
          setSeconds(clampedValue);
          break;
      }
    }
    setEditingField(null);
    setTempValue('');
    Keyboard.dismiss();
  };

  const incrementValue = (field: 'hours' | 'minutes' | 'seconds', amount: number) => {
    switch (field) {
      case 'hours':
        setHours(prev => Math.min(Math.max(prev + amount, 0), 99));
        break;
      case 'minutes':
        setMinutes(prev => Math.min(Math.max(prev + amount, 0), 59));
        break;
      case 'seconds':
        setSeconds(prev => Math.min(Math.max(prev + amount, 0), 59));
        break;
    }
  };

  const renderTimeField = (
    field: 'hours' | 'minutes' | 'seconds',
    value: number,
    label: string,
    max: number
  ) => {
    const isEditing = editingField === field;

    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>

        {/* Boutons +/- */}
        <View style={styles.fieldControls}>
          <TouchableOpacity
            style={styles.incrementButton}
            onPress={() => incrementValue(field, 1)}
            onLongPress={() => {
              const interval = setInterval(() => incrementValue(field, 1), 100);
              setTimeout(() => clearInterval(interval), 2000);
            }}
          >
            <Text style={styles.incrementButtonText}>+</Text>
          </TouchableOpacity>

          {/* Affichage de la valeur ou input */}
          {isEditing ? (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                autoFocus
                onBlur={handleFieldSave}
              />
              <TouchableOpacity
                style={styles.inputDoneButton}
                onPress={handleFieldSave}
              >
                <Check size={16} color="#10b981" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.valueDisplay}
              onPress={() => handleFieldEdit(field, value)}
            >
              <Text style={styles.valueText}>
                {value.toString().padStart(2, '0')}
              </Text>
              <Edit3 size={14} color="#9ca3af" style={styles.editIcon} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.decrementButton}
            onPress={() => incrementValue(field, -1)}
            onLongPress={() => {
              const interval = setInterval(() => incrementValue(field, -1), 100);
              setTimeout(() => clearInterval(interval), 2000);
            }}
          >
            <Text style={styles.decrementButtonText}>-</Text>
          </TouchableOpacity>
        </View>

        {/* Boutons de saisie rapide */}
        <View style={styles.quickButtons}>
          {field === 'hours' && [0, 1, 2, 3].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.quickButton, value === num && styles.quickButtonActive]}
              onPress={() => setHours(num)}
            >
              <Text style={[styles.quickButtonText, value === num && styles.quickButtonTextActive]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
          {field === 'minutes' && [0, 5, 10, 15, 30, 45].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.quickButton, value === num && styles.quickButtonActive]}
              onPress={() => setMinutes(num)}
            >
              <Text style={[styles.quickButtonText, value === num && styles.quickButtonTextActive]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
          {field === 'seconds' && [0, 15, 30, 45].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.quickButton, value === num && styles.quickButtonActive]}
              onPress={() => setSeconds(num)}
            >
              <Text style={[styles.quickButtonText, value === num && styles.quickButtonTextActive]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
        <TouchableOpacity
          onPress={handleSave}
          disabled={hours === 0 && minutes === 0 && seconds === 0}
        >
          <Text style={[
            styles.saveButton,
            (hours === 0 && minutes === 0 && seconds === 0) && styles.saveButtonDisabled
          ]}>
            OK
          </Text>
        </TouchableOpacity>
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

      <View style={styles.fieldsContainer}>
        {renderTimeField('hours', hours, 'Heures', 99)}
        {renderTimeField('minutes', minutes, 'Minutes', 59)}
        {renderTimeField('seconds', seconds, 'Secondes', 59)}
      </View>

      <View style={styles.helpText}>
        <Text style={styles.helpTextContent}>
          💡 Appuyez sur les valeurs pour saisir directement au clavier
        </Text>
        <Text style={styles.helpTextContent}>
          Maintenez +/- pour incrémenter rapidement
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
    color: '#ef4444',
  },
  saveButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#6b7280',
  },
  previewContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  previewLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  previewTime: {
    fontSize: 36,
    fontWeight: '600',
    color: '#8b5cf6',
    letterSpacing: 1,
  },
  fieldsContainer: {
    paddingHorizontal: 20,
    gap: 25,
  },
  fieldContainer: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  fieldControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 12,
  },
  incrementButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  incrementButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  decrementButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  decrementButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  valueDisplay: {
    minWidth: 80,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    gap: 8,
  },
  valueText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
  },
  editIcon: {
    opacity: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    minWidth: 80,
    height: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  inputDoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  quickButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  quickButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
    minWidth: 45,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderColor: '#8b5cf6',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  quickButtonTextActive: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  helpText: {
    marginTop: 30,
    paddingHorizontal: 30,
    gap: 8,
  },
  helpTextContent: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
});