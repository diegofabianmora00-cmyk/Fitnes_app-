import React, { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { C } from './src/theme';
import { Press, T } from './src/ui';
import { StoreProvider, useStore } from './src/store';
import Home from './src/screens/Home';
import Routines from './src/screens/Routines';
import Progress from './src/screens/Progress';
import Settings from './src/screens/Settings';
import Workout from './src/screens/Workout';
import ProfileSetup from './src/screens/ProfileSetup';

const TABS = [
  ['home', 'Inicio', 'home', Home],
  ['routines', 'Rutinas', 'barbell', Routines],
  ['progress', 'Progreso', 'stats-chart', Progress],
  ['settings', 'Ajustes', 'settings', Settings],
];

function Shell() {
  const { ready, data } = useStore();
  const ins = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [tab, setTab] = useState('home');
  const [routine, setRoutine] = useState(null);
  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  const Screen = TABS.find((t) => t[0] === tab)[3];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingTop: ins.top }}>
        <View style={{ flex: 1 }} key={tab}><Screen go={setTab} start={setRoutine} /></View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, paddingTop: 8, paddingBottom: Math.max(ins.bottom, 10), backgroundColor: C.bg }}>
          {TABS.map(([id, label, icon]) => {
            const on = id === tab;
            return (
              <Press key={id} onPress={() => setTab(id)} style={{ alignItems: 'center', paddingVertical: 4, width: 90 }}>
                <Ionicons name={on ? icon : `${icon}-outline`} size={24} color={on ? C.accent : C.mute} />
                <T style={{ fontSize: 11, marginTop: 3, color: on ? C.accent : C.mute }}>{label}</T>
              </Press>
            );
          })}
        </View>
      </View>
      {routine && <Workout routine={routine} onClose={() => setRoutine(null)} />}
      {!data.profile?.completed && <ProfileSetup />}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider><StatusBar style="light" /><Shell /></StoreProvider>
    </SafeAreaProvider>
  );
}
