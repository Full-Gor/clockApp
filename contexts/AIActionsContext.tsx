import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface PendingAction {
  type: 'alarm' | 'timer' | 'stopwatch_start' | 'stopwatch_stop' | 'rounds';
  params?: Record<string, any>;
  timestamp: number;
}

interface AIActionsContextType {
  pendingAction: PendingAction | null;
  setPendingAction: (action: PendingAction | null) => void;
  clearPendingAction: () => void;
  // Actions handlers
  handleSetAlarm: (time: string, label?: string) => void;
  handleStartTimer: (minutes: number) => void;
  handleStartStopwatch: () => void;
  handleStopStopwatch: () => void;
  handleStartRounds: (workTime: number, restTime: number, rounds: number) => void;
}

const AIActionsContext = createContext<AIActionsContextType | undefined>(undefined);

export function AIActionsProvider({ children }: { children: ReactNode }) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  // Stocker l'action et naviguer vers la page appropriée
  const handleSetAlarm = useCallback(async (time: string, label?: string) => {
    const action: PendingAction = {
      type: 'alarm',
      params: { time, label: label || 'Alarme IA' },
      timestamp: Date.now(),
    };
    setPendingAction(action);
    await AsyncStorage.setItem('pendingAIAction', JSON.stringify(action));
    router.push('/(tabs)/');
  }, []);

  const handleStartTimer = useCallback(async (minutes: number) => {
    const action: PendingAction = {
      type: 'timer',
      params: { minutes },
      timestamp: Date.now(),
    };
    setPendingAction(action);
    await AsyncStorage.setItem('pendingAIAction', JSON.stringify(action));
    router.push('/(tabs)/timer');
  }, []);

  const handleStartStopwatch = useCallback(async () => {
    const action: PendingAction = {
      type: 'stopwatch_start',
      timestamp: Date.now(),
    };
    setPendingAction(action);
    await AsyncStorage.setItem('pendingAIAction', JSON.stringify(action));
    router.push('/(tabs)/stopwatch');
  }, []);

  const handleStopStopwatch = useCallback(async () => {
    const action: PendingAction = {
      type: 'stopwatch_stop',
      timestamp: Date.now(),
    };
    setPendingAction(action);
    await AsyncStorage.setItem('pendingAIAction', JSON.stringify(action));
    router.push('/(tabs)/stopwatch');
  }, []);

  const handleStartRounds = useCallback(async (workTime: number, restTime: number, rounds: number) => {
    const action: PendingAction = {
      type: 'rounds',
      params: { workTime, restTime, rounds },
      timestamp: Date.now(),
    };
    setPendingAction(action);
    await AsyncStorage.setItem('pendingAIAction', JSON.stringify(action));
    router.push('/(tabs)/rounds');
  }, []);

  return (
    <AIActionsContext.Provider
      value={{
        pendingAction,
        setPendingAction,
        clearPendingAction,
        handleSetAlarm,
        handleStartTimer,
        handleStartStopwatch,
        handleStopStopwatch,
        handleStartRounds,
      }}
    >
      {children}
    </AIActionsContext.Provider>
  );
}

export function useAIActions() {
  const context = useContext(AIActionsContext);
  if (context === undefined) {
    throw new Error('useAIActions must be used within an AIActionsProvider');
  }
  return context;
}

// Hook pour récupérer et exécuter une action en attente
export function usePendingAIAction(actionType: string, onExecute: (params?: Record<string, any>) => void) {
  const { pendingAction, clearPendingAction } = useAIActions();

  React.useEffect(() => {
    if (pendingAction && pendingAction.type === actionType) {
      // Vérifier que l'action n'est pas trop vieille (5 secondes max)
      if (Date.now() - pendingAction.timestamp < 5000) {
        onExecute(pendingAction.params);
      }
      clearPendingAction();
      AsyncStorage.removeItem('pendingAIAction');
    }
  }, [pendingAction, actionType, onExecute, clearPendingAction]);
}
