import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Check, Globe } from 'lucide-react-native';
import { LANGUAGES, Language } from '@/services/i18n';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('selectLanguage')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.iconContainer}>
          <Globe size={48} color="#8b5cf6" />
        </View>

        {/* Language Options */}
        <ScrollView
          style={styles.optionsList}
          contentContainerStyle={styles.optionsContent}
          showsVerticalScrollIndicator={false}
        >
          {LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <View style={styles.optionInfo}>
                    <Text style={styles.nativeName}>{lang.nativeName}</Text>
                    <Text style={styles.englishName}>{lang.name}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Check size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  optionsList: {
    flex: 1,
  },
  optionsContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  optionInfo: {
    flex: 1,
  },
  nativeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  englishName: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
