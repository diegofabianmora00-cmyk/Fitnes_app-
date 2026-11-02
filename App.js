import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, BackHandler, Dimensions, ScrollView, Vibration, View } from 'react-native';
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

function AnimatedTabIcon({ name, active, id }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      bounce.setValue(0);
      Animated.spring(bounce, {
        toValue: 1,
        speed: 35,
        bounciness: 10,
        useNativeDriver: true,
      }).start(() => {
        Animated.spring(bounce, {
          toValue: 0,
          speed: 60,
          bounciness: 4,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [active]);

  let transform = [];
  if (id === 'home') {
    const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
    const translateY = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
    transform = [{ scale }, { translateY }];
  } else if (id === 'routines') {
    const rotate = bounce.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-22deg'] });
    const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
    transform = [{ scale }, { rotate }];
  } else if (id === 'progress') {
    const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });
    transform = [{ scale }];
  } else if (id === 'settings') {
    const rotate = bounce.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
    const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
    transform = [{ scale }, { rotate }];
  }

  return (
    <Animated.View style={{ transform }}>
      <Ionicons name={active ? name : `${name}-outline`} size={24} color={active ? C.accent : C.mute} />
    </Animated.View>
  );
}

function Shell() {
  const { ready, data } = useStore();
  const ins = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [tab, setTab] = useState('home');
  const [routine, setRoutine] = useState(null);
  const [draft, setDraft] = useState(null);
  const workoutBackRef = useRef(null);
  const scrollRef = useRef(null);
  const edgeVibrationRef = useRef({ left: false, right: false });
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
          decelerationRate="fast"
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const x = contentOffset.x;
            const max = contentSize.width - layoutMeasurement.width;
            if (x <= 0) {
              if (!edgeVibrationRef.current.left) {
                Vibration.vibrate(10);
                edgeVibrationRef.current.left = true;
              }
            } else {
              edgeVibrationRef.current.left = false;
            }
            if (x >= max - 5 && max > 0) {
              if (!edgeVibrationRef.current.right) {
                Vibration.vibrate(10);
                edgeVibrationRef.current.right = true;
              }
            } else {
              edgeVibrationRef.current.right = false;
            }
          }}
          onScrollEndDrag={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const idx = Math.round(offsetX / W);
            if (TABS[idx] && TABS[idx][0] !== tab) {
              Vibration.vibrate(12);
              setTab(TABS[idx][0]);
            }
          }}
          onMomentumScrollEnd={(e) => {
            const offsetX = e.nativeEvent.contentOffset.x;
            const idx = Math.round(offsetX / W);
            if (TABS[idx] && TABS[idx][0] !== tab) {
              Vibration.vibrate(12);
              setTab(TABS[idx][0]);
            }
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ width: W * TABS.length }}
        >
          {TABS.map(([id, , , Comp]) => (
            <View key={id} style={{ width: W, flex: 1 }}>
              <Comp go={setTab} start={setRoutine} isActive={tab === id} />
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, paddingTop: 6, paddingBottom: Math.max(ins.bottom, 10), backgroundColor: C.bg }}>
          {TABS.map(([id, label, icon]) => {
            const on = id === tab;
            return (
              <Press key={id} onPress={() => {
                Vibration.vibrate(12);
                setTab(id);
                const idx = TABS.findIndex((t) => t[0] === id);
                if (idx !== -1 && scrollRef.current) {
                  scrollRef.current.scrollTo({ x: idx * W, animated: false });
                }
              }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48, paddingVertical: 4 }} hitSlop={8}>
                <AnimatedTabIcon name={icon} active={on} id={id} />
                <T style={{ fontSize: 11, marginTop: 3, color: on ? C.accent : C.mute, fontWeight: on ? '700' : '400' }}>{label}</T>
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
