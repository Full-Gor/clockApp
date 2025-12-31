import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, MapPin, Settings2, X } from 'lucide-react-native';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HolographicClock,
  FluidClock,
  FlapClock,
  ClockSelector,
  useClockSelection,
} from '../../components/clocks';

interface WorldClock {
  id: string;
  city: string;
  timezone: string;
  country: string;
}

const defaultClocks: WorldClock[] = [
  { id: '1', city: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { id: '2', city: 'New York', timezone: 'America/New_York', country: 'États-Unis' },
  { id: '3', city: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japon' },
  { id: '4', city: 'London', timezone: 'Europe/London', country: 'Royaume-Uni' },
];

const popularTimezones = [
  { city: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'États-Unis' },
  { city: 'Sydney', timezone: 'Australia/Sydney', country: 'Australie' },
  { city: 'Dubai', timezone: 'Asia/Dubai', country: 'Émirats Arabes Unis' },
  { city: 'Moscow', timezone: 'Europe/Moscow', country: 'Russie' },
  { city: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapour' },
  { city: 'Berlin', timezone: 'Europe/Berlin', country: 'Allemagne' },
  { city: 'Mumbai', timezone: 'Asia/Kolkata', country: 'Inde' },
  { city: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brésil' },
];

export default function WorldClockScreen() {
  const [clocks, setClocks] = useState<WorldClock[]>(defaultClocks);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showClockSelector, setShowClockSelector] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const { selectedClock, setSelectedClock, loading: clockLoading } = useClockSelection();

  // Theme colors
  const theme = {
    bg: darkMode ? ['#1a1a2e', '#16213e'] : ['#e8eef3', '#d4dde6'],
    cardBg: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)',
    text: darkMode ? '#fff' : '#1a1a2e',
    subtext: darkMode ? '#9ca3af' : '#6b7280',
  };

  // Render the selected clock component
  const renderSelectedClock = () => {
    switch (selectedClock) {
      case 'holographic':
        return <HolographicClock />;
      case 'fluid':
        return <FluidClock />;
      case 'flap-dark':
        return <FlapClock theme="dark" />;
      case 'flap-light':
        return <FlapClock theme="light" />;
      case 'digital':
      default:
        return null;
    }
  };

  useEffect(() => {
    loadClocks();
    loadDarkMode();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDarkMode = async () => {
    try {
      const settings = await AsyncStorage.getItem('app_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode ?? true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du mode:', error);
    }
  };

  const loadClocks = async () => {
    try {
      const savedClocks = await AsyncStorage.getItem('worldClocks');
      if (savedClocks) {
        setClocks(JSON.parse(savedClocks));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des horloges:', error);
    }
  };

  const saveClocks = async (newClocks: WorldClock[]) => {
    try {
      await AsyncStorage.setItem('worldClocks', JSON.stringify(newClocks));
      setClocks(newClocks);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  const addClock = (clockData: Omit<WorldClock, 'id'>) => {
    const newClock: WorldClock = {
      ...clockData,
      id: Date.now().toString(),
    };

    const newClocks = [...clocks, newClock];
    saveClocks(newClocks);
    setShowModal(false);
  };

  const removeClock = (clockId: string) => {
    const newClocks = clocks.filter(clock => clock.id !== clockId);
    saveClocks(newClocks);
  };

  const getTimeInTimezone = (timezone: string) => {
    return moment().tz(timezone);
  };

  const getTimeDifference = (timezone: string) => {
    const localTime = moment();
    const targetTime = moment().tz(timezone);
    const diff = targetTime.utcOffset() - localTime.utcOffset();
    const hours = Math.floor(Math.abs(diff) / 60);
    const minutes = Math.abs(diff) % 60;

    const sign = diff >= 0 ? '+' : '-';
    return minutes > 0 ? `${sign}${hours}h${minutes}` : `${sign}${hours}h`;
  };

  const filteredTimezones = popularTimezones.filter(tz =>
    tz.city.toLowerCase().includes(searchText.toLowerCase()) ||
    tz.country.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <LinearGradient colors={theme.bg as [string, string]} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header - Neumorphic */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Horloge Mondiale</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.cardBg }]}
              onPress={() => setShowClockSelector(true)}
            >
              <LinearGradient
                colors={['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.1)']}
                style={styles.buttonGradient}
              >
                <Settings2 size={20} color="#8b5cf6" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButtonContainer}
              onPress={() => setShowModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                style={styles.addButton}
              >
                <View style={styles.addButtonGloss} />
                <Plus size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Render selected clock */}
        {selectedClock !== 'digital' && (
          <View style={[styles.clockCard, { backgroundColor: theme.cardBg }]}>
            <View style={styles.clockGloss} />
            {renderSelectedClock()}
          </View>
        )}

        {/* World clocks list - Neumorphic Cards */}
        {selectedClock === 'digital' && (
          <View style={styles.clocksContainer}>
            {clocks.map((clock, index) => {
              const time = getTimeInTimezone(clock.timezone);
              const timeDiff = getTimeDifference(clock.timezone);
              const isToday = time.isSame(moment(), 'day');
              const dayText = isToday ? 'Aujourd\'hui' :
                             time.isAfter(moment(), 'day') ? 'Demain' : 'Hier';
              const isPrimary = index === 0;

              return (
                <TouchableOpacity
                  key={clock.id}
                  style={[
                    styles.clockItem,
                    isPrimary && styles.primaryClockItem,
                  ]}
                  onLongPress={() => !isPrimary && removeClock(clock.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isPrimary
                      ? ['#8b5cf6', '#7c3aed']
                      : [theme.cardBg, theme.cardBg]}
                    style={styles.clockItemGradient}
                  >
                    {/* Glossy overlay */}
                    <View style={[styles.itemGloss, { opacity: isPrimary ? 0.2 : 0.05 }]} />

                    {/* Remove button for non-primary */}
                    {!isPrimary && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeClock(clock.id)}
                      >
                        <X size={14} color={theme.subtext} />
                      </TouchableOpacity>
                    )}

                    <View style={styles.clockHeader}>
                      <View style={styles.clockInfo}>
                        <Text style={[
                          styles.cityName,
                          { color: isPrimary ? '#fff' : theme.text }
                        ]}>
                          {clock.city}
                        </Text>
                        <Text style={[
                          styles.countryName,
                          { color: isPrimary ? 'rgba(255,255,255,0.8)' : theme.subtext }
                        ]}>
                          {clock.country}
                        </Text>
                      </View>
                      <View style={[
                        styles.timeDiffBadge,
                        { backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : 'rgba(139,92,246,0.2)' }
                      ]}>
                        <Text style={[
                          styles.timeDiff,
                          { color: isPrimary ? '#fff' : '#8b5cf6' }
                        ]}>
                          {timeDiff}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.clockTime}>
                      <Text style={[
                        styles.time,
                        isPrimary && styles.primaryTime,
                        { color: isPrimary ? '#fff' : theme.text }
                      ]}>
                        {time.format('HH:mm')}
                      </Text>
                      <Text style={[
                        styles.seconds,
                        { color: isPrimary ? 'rgba(255,255,255,0.7)' : theme.subtext }
                      ]}>
                        {time.format('ss')}
                      </Text>
                    </View>

                    <View style={[
                      styles.dayBadge,
                      { backgroundColor: isPrimary ? 'rgba(255,255,255,0.15)' : 'rgba(139,92,246,0.1)' }
                    ]}>
                      <Text style={[
                        styles.dayText,
                        { color: isPrimary ? '#fff' : '#8b5cf6' }
                      ]}>
                        {dayText}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Clock Selector Modal */}
      <ClockSelector
        visible={showClockSelector}
        onClose={() => setShowClockSelector(false)}
        selectedClock={selectedClock}
        onSelect={setSelectedClock}
      />

      {/* Add City Modal - Neumorphic */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient colors={theme.bg as [string, string]} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Ajouter une ville</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search - Neumorphic */}
          <View style={[styles.searchContainer, { backgroundColor: theme.cardBg }]}>
            <MapPin size={20} color={theme.subtext} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Rechercher une ville..."
              placeholderTextColor={theme.subtext}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Timezone List */}
          <ScrollView style={styles.timezoneList}>
            {filteredTimezones.map((timezone, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.timezoneItem, { backgroundColor: theme.cardBg }]}
                onPress={() => addClock(timezone)}
                activeOpacity={0.7}
              >
                <View style={styles.itemGloss} />
                <View style={styles.timezoneInfo}>
                  <Text style={[styles.timezoneName, { color: theme.text }]}>
                    {timezone.city}
                  </Text>
                  <Text style={[styles.timezoneCountry, { color: theme.subtext }]}>
                    {timezone.country}
                  </Text>
                </View>
                <View style={styles.timezoneTimeContainer}>
                  <Text style={styles.timezoneTime}>
                    {getTimeInTimezone(timezone.timezone).format('HH:mm')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonContainer: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addButtonGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  // Clock Card
  clockCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  clockGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 1,
  },

  // World Clocks List
  clocksContainer: {
    paddingHorizontal: 20,
  },
  clockItem: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryClockItem: {
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  clockItemGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  itemGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clockInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryName: {
    fontSize: 14,
    marginTop: 2,
  },
  timeDiffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeDiff: {
    fontSize: 12,
    fontWeight: '700',
  },
  clockTime: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  time: {
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: -2,
  },
  primaryTime: {
    fontSize: 48,
    fontWeight: '200',
  },
  seconds: {
    fontSize: 20,
    fontWeight: '300',
    marginLeft: 6,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Modal
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  timezoneList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timezoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timezoneCountry: {
    fontSize: 14,
    marginTop: 2,
  },
  timezoneTimeContainer: {
    backgroundColor: 'rgba(139,92,246,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  timezoneTime: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '700',
  },
});
