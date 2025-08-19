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
import { Plus, MapPin, Clock } from 'lucide-react-native';
import moment from 'moment-timezone';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  useEffect(() => {
    loadClocks();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Horloge Mondiale</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.clocksContainer}>
          {clocks.map((clock, index) => {
            const time = getTimeInTimezone(clock.timezone);
            const timeDiff = getTimeDifference(clock.timezone);
            const isToday = time.isSame(moment(), 'day');
            const dayText = isToday ? 'Aujourd\'hui' : 
                           time.isAfter(moment(), 'day') ? 'Demain' : 'Hier';

            return (
              <TouchableOpacity
                key={clock.id}
                style={[styles.clockItem, index === 0 && styles.firstClockItem]}
                onLongPress={() => index > 0 && removeClock(clock.id)}
              >
                <LinearGradient
                  colors={index === 0 ? ['#8b5cf6', '#7c3aed'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.clockGradient}
                >
                  <View style={styles.clockHeader}>
                    <View style={styles.clockInfo}>
                      <Text style={[styles.cityName, index === 0 && styles.primaryCity]}>
                        {clock.city}
                      </Text>
                      <Text style={[styles.countryName, index === 0 && styles.primaryCountry]}>
                        {clock.country}
                      </Text>
                    </View>
                    <View style={styles.timeInfo}>
                      <Text style={[styles.timeDiff, index === 0 && styles.primaryTimeDiff]}>
                        {timeDiff}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.clockTime}>
                    <Text style={[styles.time, index === 0 && styles.primaryTime]}>
                      {time.format('HH:mm')}
                    </Text>
                    <Text style={[styles.seconds, index === 0 && styles.primarySeconds]}>
                      {time.format('ss')}
                    </Text>
                  </View>
                  
                  <Text style={[styles.dayText, index === 0 && styles.primaryDayText]}>
                    {dayText}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ajouter une ville</Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchContainer}>
            <MapPin size={20} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une ville..."
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView style={styles.timezoneList}>
            {filteredTimezones.map((timezone, index) => (
              <TouchableOpacity
                key={index}
                style={styles.timezoneItem}
                onPress={() => addClock(timezone)}
              >
                <View style={styles.timezoneInfo}>
                  <Text style={styles.timezoneName}>{timezone.city}</Text>
                  <Text style={styles.timezoneCountry}>{timezone.country}</Text>
                </View>
                <Text style={styles.timezoneTime}>
                  {getTimeInTimezone(timezone.timezone).format('HH:mm')}
                </Text>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#8b5cf6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clocksContainer: {
    paddingHorizontal: 20,
  },
  clockItem: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  firstClockItem: {
    marginBottom: 24,
  },
  clockGradient: {
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  primaryCity: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryName: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 2,
  },
  primaryCountry: {
    color: '#e5e7eb',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeDiff: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  primaryTimeDiff: {
    color: '#e5e7eb',
  },
  clockTime: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  time: {
    fontSize: 36,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: -1,
  },
  primaryTime: {
    fontSize: 42,
    fontWeight: '200',
  },
  seconds: {
    fontSize: 18,
    fontWeight: '300',
    color: '#d1d5db',
    marginLeft: 4,
  },
  primarySeconds: {
    fontSize: 20,
    color: '#e5e7eb',
  },
  dayText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  primaryDayText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
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
    color: '#fff',
  },
  cancelButton: {
    fontSize: 16,
    color: '#8b5cf6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  timezoneList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timezoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  timezoneCountry: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 2,
  },
  timezoneTime: {
    fontSize: 16,
    color: '#8b5cf6',
    fontWeight: '600',
  },
});