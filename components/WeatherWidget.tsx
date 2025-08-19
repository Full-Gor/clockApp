import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Cloud, Sun, CloudRain, CloudSnow, MapPin, Thermometer } from 'lucide-react-native';
import * as Location from 'expo-location';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Demander la permission de géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de géolocalisation refusée');
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Obtenir le nom de la ville
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const city = reverseGeocode[0]?.city || reverseGeocode[0]?.subregion || 'Ville inconnue';
      
      // Simuler des données météo (remplacez par une vraie API comme OpenWeatherMap)
      const mockWeatherData: WeatherData = {
        location: city,
        temperature: Math.round(Math.random() * 30 + 5), // 5-35°C
        condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
        description: ['Ensoleillé', 'Nuageux', 'Pluvieux', 'Neigeux'][Math.floor(Math.random() * 4)],
        humidity: Math.round(Math.random() * 40 + 30), // 30-70%
        windSpeed: Math.round(Math.random() * 20 + 5), // 5-25 km/h
      };
      
      setWeather(mockWeatherData);
    } catch (error) {
      console.error('Erreur lors du chargement de la météo:', error);
      setError('Impossible de charger la météo');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun size={24} color="#f59e0b" />;
      case 'cloudy':
        return <Cloud size={24} color="#9ca3af" />;
      case 'rainy':
        return <CloudRain size={24} color="#3b82f6" />;
      case 'snowy':
        return <CloudSnow size={24} color="#e5e7eb" />;
      default:
        return <Sun size={24} color="#f59e0b" />;
    }
  };

  const getGradientColors = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return ['#f59e0b', '#f97316'];
      case 'cloudy':
        return ['#6b7280', '#9ca3af'];
      case 'rainy':
        return ['#3b82f6', '#1d4ed8'];
      case 'snowy':
        return ['#e5e7eb', '#d1d5db'];
      default:
        return ['#8b5cf6', '#7c3aed'];
    }
  };

  if (error) {
    return (
      <TouchableOpacity style={styles.container} onPress={loadWeather}>
        <LinearGradient colors={['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']} style={styles.weatherCard}>
          <View style={styles.errorContainer}>
            <MapPin size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.retryText}>Appuyez pour réessayer</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (loading || !weather) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(156, 163, 175, 0.3)', 'rgba(156, 163, 175, 0.1)']} style={styles.weatherCard}>
          <View style={styles.loadingContainer}>
            <Thermometer size={20} color="#9ca3af" />
            <Text style={styles.loadingText}>Chargement de la météo...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={loadWeather}>
      <LinearGradient 
        colors={[
          `${getGradientColors(weather.condition)[0]}33`,
          `${getGradientColors(weather.condition)[1]}22`
        ]} 
        style={styles.weatherCard}
      >
        <View style={styles.weatherHeader}>
          <View style={styles.locationContainer}>
            <MapPin size={16} color="#9ca3af" />
            <Text style={styles.locationText}>{weather.location}</Text>
          </View>
          {getWeatherIcon(weather.condition)}
        </View>
        
        <View style={styles.weatherContent}>
          <Text style={styles.temperature}>{weather.temperature}°</Text>
          <Text style={styles.description}>{weather.description}</Text>
        </View>
        
        <View style={styles.weatherDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Humidité</Text>
            <Text style={styles.detailValue}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Vent</Text>
            <Text style={styles.detailValue}>{weather.windSpeed} km/h</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  weatherCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  weatherContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  temperature: {
    fontSize: 36,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -1,
  },
  description: {
    fontSize: 16,
    color: '#d1d5db',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});