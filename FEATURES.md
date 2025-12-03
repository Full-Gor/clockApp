# Nouvelles Fonctionnalités - ClockApp

Ce document décrit les nouvelles fonctionnalités avancées ajoutées à l'application.

## 1. Alerte Personnalisée (CustomAlert)

### Description
Modal d'alerte moderne avec design cohérent au thème de l'application, remplaçant les alertes natives.

### Caractéristiques
- **Design moderne** avec LinearGradient et border radius
- **Animations fluides** - Apparition avec spring animation et pulsation de l'icône
- **Icônes contextuelles** - Différents emojis selon le type (⏰ Timer, 🥊 Rounds, ✅ Success)
- **Bouton "Arrêter le son"** - Permet de couper l'alarme sans fermer la modal
- **Feedback haptique** - Vibrations sur toutes les interactions

### Utilisation

```typescript
import { CustomAlert } from '@/components/CustomAlert';

<CustomAlert
  visible={showAlert}
  title="Temps écoulé !"
  message="Votre minuteur est terminé."
  icon="timer" // 'timer' | 'alarm' | 'round' | 'success'
  showStopButton={true}
  onStop={handleStopAlarm}
  onDismiss={() => setShowAlert(false)}
/>
```

### Emplacement
`/components/CustomAlert.tsx`

---

## 2. Son Progressif (Fade-In)

### Description
Augmentation progressive du volume de l'alarme pour un réveil en douceur.

### Caractéristiques
- **Volume progressif** - Commence à 0% et monte graduellement à 100%
- **Durée configurable** - Par défaut 5 secondes, ajustable
- **50 étapes de transition** - Pour une montée douce et fluide
- **Arrêt propre** - Le fade-in s'arrête proprement si l'alarme est coupée

### Utilisation

```typescript
import { soundManager } from '@/services/soundService';

// Son normal
await soundManager.playAlarmSound(soundId);

// Son avec fade-in de 5 secondes
await soundManager.playAlarmWithFadeIn(soundId, 5000);

// Son avec fade-in de 10 secondes
await soundManager.playAlarmWithFadeIn(soundId, 10000);

// Arrêter le son
await soundManager.stopCurrentAlarm();
```

### Configuration dans les Alarmes

Pour activer le fade-in dans vos alarmes, ajoutez cette option :

```typescript
interface AlarmConfig {
  useFadeIn: boolean;
  fadeInDuration: number; // en millisecondes
}
```

---

## 3. Contrôle de Luminosité

### Description
Gestion automatique de la luminosité de l'écran pour les alarmes.

### Caractéristiques
- **Luminosité faible** - Écran tamisé pour la nuit (ex: 10%)
- **Luminosité normale** - Écran lumineux pour le jour (ex: 100%)
- **Transition progressive** - Augmentation graduelle en 2 secondes
- **Sauvegarde de l'originale** - Restauration automatique après l'alarme
- **Permissions gérées** - Demande automatique des permissions Android/iOS

### Utilisation

```typescript
import { brightnessManager } from '@/services/brightnessService';

// Initialiser
await brightnessManager.initialize();

// Définir une luminosité fixe (0.0 - 1.0)
await brightnessManager.setBrightness(0.2); // 20%

// Transition progressive vers une luminosité
await brightnessManager.setBrightnessFade(1.0, 2000); // 100% en 2s

// Restaurer la luminosité originale
await brightnessManager.restoreOriginalBrightness();

// Revenir au mode système
await brightnessManager.setSystemBrightnessMode();
```

### Exemple pour une Alarme

```typescript
// Au déclenchement de l'alarme
await brightnessManager.setBrightnessFade(1.0, 2000); // Augmenter progressivement

// Quand l'utilisateur arrête l'alarme
await brightnessManager.restoreOriginalBrightness();
```

---

## 4. Notification Vocale (Text-to-Speech)

### Description
Synthèse vocale pour lire des notifications textuelles à haute voix.

### Caractéristiques
- **Voix française** - Synthèse en français (fr-FR)
- **Lecture en boucle** - Répétition automatique avec intervalle configurable
- **Contrôle complet** - Play, Pause, Resume, Stop
- **Options personnalisables** - Pitch, vitesse, langue

### Utilisation

```typescript
import { ttsManager } from '@/services/ttsService';

// Parler une fois
await ttsManager.speak("Bonjour, il est l'heure de se réveiller !");

// Parler en boucle toutes les 5 secondes
await ttsManager.speakLoop("Réveil ! Il est 7 heures !", 5000);

// Options personnalisées
await ttsManager.speak("Message important", {
  language: 'fr-FR',
  pitch: 1.2,
  rate: 0.8,
});

// Contrôles
await ttsManager.pause();
await ttsManager.resume();
await ttsManager.stop();
await ttsManager.stopLoop(); // Arrêter la boucle uniquement

// Vérifier si en cours
const isSpeaking = ttsManager.isSpeakingNow();

// Obtenir les voix disponibles
const voices = await ttsManager.getAvailableVoices();
```

### Configuration dans une Alarme

```typescript
interface AlarmConfig {
  useVoiceNotification: boolean;
  voiceMessage: string;
  voiceLoop: boolean;
  voiceLoopInterval: number; // en ms
}

// Exemple
const alarmConfig = {
  useVoiceNotification: true,
  voiceMessage: "Bonjour ! Il est l'heure de se lever !",
  voiceLoop: true,
  voiceLoopInterval: 3000, // Répéter toutes les 3 secondes
};

// Au déclenchement
if (alarmConfig.useVoiceNotification) {
  if (alarmConfig.voiceLoop) {
    await ttsManager.speakLoop(
      alarmConfig.voiceMessage,
      alarmConfig.voiceLoopInterval
    );
  } else {
    await ttsManager.speak(alarmConfig.voiceMessage);
  }
}
```

---

## 5. Mode VR (Réalité Virtuelle)

### État Actuel
❌ **Non implémenté** - Nécessite des dépendances et intégration spécifiques

### Pourquoi c'est complexe

1. **Dépendances lourdes**
   ```json
   {
     "react-vr": "^2.x.x",
     "react-native-vr": "^x.x.x",
     "@react-three/fiber": "^8.x.x"
   }
   ```

2. **Configuration spécifique**
   - Modifications du `app.json` pour les capabilities VR
   - Configuration Android avec OpenXR/Oculus SDK
   - Configuration iOS avec ARKit

3. **Matériel requis**
   - Meta Quest 2/3/Pro
   - Apple Vision Pro
   - HTC Vive/Valve Index (via PC)
   - Samsung Gear VR

### Plan d'Implémentation Futur

#### Phase 1: Setup de Base
```bash
# Installation des dépendances VR
npm install react-vr @react-three/fiber @react-three/xr

# Configuration Expo pour VR
# Ajouter dans app.json:
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "android.intent.action.VIEW",
          "category": ["android.intent.category.VR"]
        }
      ]
    }
  }
}
```

#### Phase 2: Composants VR
```typescript
// VRAlarmView.tsx
import { VRCanvas } from '@react-three/xr';

export const VRAlarmView = () => {
  return (
    <VRCanvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {/* Horloge 3D flottante */}
      <Clock3D time={currentTime} />
      {/* Interface VR pour arrêter l'alarme */}
      <VRButton onPress={stopAlarm} position={[0, -1, -2]}>
        Arrêter
      </VRButton>
    </VRCanvas>
  );
};
```

#### Phase 3: Contrôles VR
```typescript
// Support des contrôleurs VR
import { useController } from '@react-three/xr';

const VRControls = () => {
  const leftController = useController('left');
  const rightController = useController('right');

  // Gestes pour arrêter l'alarme
  // - Bouton A/X
  // - Geste de la main
  // - Commande vocale
};
```

#### Phase 4: Adaptations UI
```typescript
// Adapter l'interface pour le VR
const isVRMode = await VRManager.isVRAvailable();

if (isVRMode) {
  return <VRAlarmInterface />;
} else {
  return <StandardAlarmInterface />;
}
```

### Fonctionnalités VR Envisagées

1. **Horloge 3D immersive**
   - Affichage circulaire 360°
   - Chiffres flottants dans l'espace

2. **Alarmes spatiales**
   - Positionnement 3D du son
   - Son qui "se rapproche" progressivement

3. **Environnements thématiques**
   - Plage au lever du soleil
   - Forêt paisible
   - Espace cosmique

4. **Gestes naturels**
   - Lever la main pour snooze
   - Applaudir pour arrêter
   - Regarder l'horloge pour voir les détails

### Compatibilité Lunettes Connectées

#### Meta Quest 2/3/Pro
- Support natif via React Native VR
- Résolution: 1832x1920 par œil
- Refresh rate: 90Hz/120Hz

#### Apple Vision Pro
- Support via visionOS SDK (à venir)
- Résolution: 3660x3200 par œil
- Passthrough ultra HD

#### Estimation du Temps de Développement
- Setup de base: **2-3 jours**
- Composants VR: **1 semaine**
- Tests et optimisation: **1 semaine**
- **Total: 2-3 semaines** pour une version de base

### Ressources

- [React VR Documentation](https://github.com/facebookarchive/react-vr)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Expo XR (expérimental)](https://docs.expo.dev/versions/latest/sdk/gl-view/)

---

## Installation des Nouvelles Dépendances

```bash
# Installer les packages requis
npm install expo-brightness expo-speech

# Pour iOS
npx pod-install

# Rebuild le projet
npm run dev
```

## Permissions Requises

Ajoutez dans `app.json`:

```json
{
  "expo": {
    "android": {
      "permissions": [
        "WRITE_SETTINGS",
        "SYSTEM_ALERT_WINDOW"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Cette app utilise la synthèse vocale pour les alarmes"
      }
    }
  }
}
```

---

## Exemple Complet: Alarme Avancée

```typescript
import { CustomAlert } from '@/components/CustomAlert';
import { soundManager } from '@/services/soundService';
import { brightnessManager } from '@/services/brightnessService';
import { ttsManager } from '@/services/ttsService';

const handleAlarmTrigger = async () => {
  // 1. Augmenter la luminosité progressivement
  await brightnessManager.setBrightnessFade(1.0, 3000);

  // 2. Démarrer le son avec fade-in
  await soundManager.playAlarmWithFadeIn('gentle', 5000);

  // 3. Annoncer l'heure vocalement en boucle
  await ttsManager.speakLoop(
    "Il est 7 heures, bonjour !",
    10000 // Toutes les 10 secondes
  );

  // 4. Afficher l'alerte
  setShowAlert(true);
};

const handleStopAlarm = async () => {
  // Tout arrêter
  await soundManager.stopCurrentAlarm();
  await ttsManager.stop();
  await brightnessManager.restoreOriginalBrightness();
  setShowAlert(false);
};

return (
  <CustomAlert
    visible={showAlert}
    title="Réveil !"
    message="Il est temps de commencer la journée !"
    icon="alarm"
    showStopButton={true}
    onStop={handleStopAlarm}
    onDismiss={handleStopAlarm}
  />
);
```

---

## Support et Documentation

- **CustomAlert**: `/components/CustomAlert.tsx`
- **Sound Service**: `/services/soundService.ts`
- **Brightness Service**: `/services/brightnessService.ts`
- **TTS Service**: `/services/ttsService.ts`

Pour toute question ou suggestion, consultez la documentation Expo:
- [expo-brightness](https://docs.expo.dev/versions/latest/sdk/brightness/)
- [expo-speech](https://docs.expo.dev/versions/latest/sdk/speech/)
