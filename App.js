import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, BackHandler, Dimensions, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { C } from './src/theme';
import { Press, T } from './src/ui';
import { KEYS, StoreProvider, useStore } from './src/store';
import Home from './src/screens/Home';
import Routines from './src/screens/Routines';
import Progress from './src/screens/Progress';
import Settings from './src/screens/Settings';
import Workout from './src/screens/Workout';
import ProfileSetup from './src/screens/ProfileSetup';

const DRAFT_KEY = KEYS.draft;

const isValidDraft = (d) => {
  if (!d || typeof d !== 'object') return false;
  if (!d.routine || typeof d.routine !== 'object' || !Array.isArray(d.routine.exercises)) return false;
  if (!Array.isArray(d.log) || d.log.length === 0) return false;
  if (typeof d.exIndex !== 'number' || typeof d.setIndex !== 'number') return false;
  if (d.exIndex < 0 || d.exIndex >= d.log.length || d.setIndex < 0) return false;
  return d.log.every((b) => b && b.ex && Array.isArray(b.sets));
};

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
  const [draft, setDraft] = useState(null);
  const workoutBackRef = useRef(null);
  const scrollRef = useRef(null);
  const W = Dimensions.get('window').width;

  useEffect(() => {
    const idx = TABS.findIndex((t) => t[0] === tab);
    if (idx !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: idx * W, animated: true });
    }
  }, [tab]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    const discard = () => { AsyncStorage.removeItem(DRAFT_KEY).catch(() => {}); };
    AsyncStorage.getItem(DRAFT_KEY).then((v) => {
      if (!alive || !v) return;
      let d = null;
      try { d = JSON.parse(v); } catch (e) { d = null; }
      if (!isValidDraft(d)) { discard(); return; }
      Alert.alert(
        'Entreno sin terminar',
        `Tienes "${d.routine.name || 'tu rutina'}" en curso. ¿Qué deseas hacer?`,
        [
          { text: 'Descartar', style: 'destructive', onPress: discard },
          { text: 'Continuar entreno', onPress: () => { setDraft(d); setRoutine(d.routine); } },
        ],
        { cancelable: false }
      );
    }).catch(() => {});
    return () => { alive = false; };
  }, [ready]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (routine) {
        if (workoutBackRef.current) workoutBackRef.current();
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [routine, tab]);

  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: C.bg }} />;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingTop: ins.top }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const idx = Math.round(offsetX / W);
            if (TABS[idx] && TABS[idx][0] !== tab) {
              setTab(TABS[idx][0]);
            }
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ width: W * TABS.length }}
        >
          {TABS.map(([id, , , Comp]) => (
            <View key={id} style={{ width: W, flex: 1 }}>
              <Comp go={setTab} start={setRoutine} />
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, paddingTop: 6, paddingBottom: Math.max(ins.bottom, 10), backgroundColor: C.bg }}>
          {TABS.map(([id, label, icon]) => {
            const on = id === tab;
            return (
              <Press key={id} onPress={() => setTab(id)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingVertical: 4 }} hitSlop={8}>
                <Ionicons name={on ? icon : `${icon}-outline`} size={24} color={on ? C.accent : C.mute} />
                <T style={{ fontSize: 11, marginTop: 3, color: on ? C.accent : C.mute }}>{label}</T>
              </Press>
            );
          })}
        </View>
      </View>
      {routine && <Workout routine={routine} draft={draft} workoutBackRef={workoutBackRef} onClose={() => { setRoutine(null); setDraft(null); }} />}
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
