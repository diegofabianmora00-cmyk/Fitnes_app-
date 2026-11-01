const DRAFT_KEY = 'fitnesscoach:v1:draft';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { Btn, Card, Field, Press, T } from '../ui';
import { fromU, lastSets, toU, uid, useStore } from '../store';
import { exerciseById } from '../exercises';
import { exerciseReview, newRecords, recommendFor, RULES, sessionReview } from '../recommend';
import Coach from '../Coach';
import RuleInfo from '../RuleInfo';
import SessionReview from '../SessionReview';

const mm = (s) => `${Math.floor(s / 60)}:${String(Math.abs(Math.floor(s)) % 60).padStart(2, '0')}`;

const initLog = (data, routine, u) => routine.exercises.map((ex) => {
  const rec = recommendFor(data, ex);
  const prev = lastSets(data, ex.id);
  const sets = Array.from({ length: ex.sets }, (_, i) => ({
    w: rec.weightKg == null ? '' : (rec.weightKg > 0 ? String(toU(rec.weightKg, u)) : ''),
    r: prev[i] ? String(prev[i].r) : '',
    rir: null,
    startedAt: null,
    endedAt: null,
    restBeforeSec: null,
    done: false,
  }));
  return { ex, rec, sets, manualWeightKg: null };
});

export default function Workout({ routine, onClose, workoutBackRef }) {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const u = data.unit;
  const stepW = u === 'kg' ? 2.5 : 5;
  const y = useRef(new Animated.Value(900)).current;
  const sessionStart = useRef(Date.now());

  const [log, setLog] = useState(() => initLog(data, routine, u));
  const [exIndex, setExIndex] = useState(0);
  const [phase, setPhase] = useState('recommend');
  const [setIndex, setSetIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [restTarget, setRestTarget] = useState(90);
  const [restStarted, setRestStarted] = useState(null);
  const [why, setWhy] = useState(null);
  const [saved, setSaved] = useState(null);
  const [adjOpen, setAdjOpen] = useState(false);
  const [adjValue, setAdjValue] = useState(0);
  const [noHistWeight, setNoHistWeight] = useState(stepW);
  const [reg, setReg] = useState({ r: '', w: '', rir: null });
  const [regTouched, setRegTouched] = useState(false);

  useEffect(() => { Animated.spring(y, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }).start(); }, []);
  useEffect(() => {
    if (phase === 'running' || phase === 'rest') {
      const t = setInterval(() => setNow(Date.now()), 250);
      return () => clearInterval(t);
    }
  }, [phase]);

  const cur = log[exIndex];
  const rec = cur.rec;
  const totalSets = cur.ex.sets;
  const completedSets = cur.sets.filter((s) => s.done).length;
  const effectiveWeightKg = cur.manualWeightKg != null ? cur.manualWeightKg : rec.weightKg;

  const close = () => Animated.timing(y, { toValue: 900, duration: 240, useNativeDriver: true }).start(onClose);
  const closeAll = () => { setSaved(null); AsyncStorage.removeItem(DRAFT_KEY).catch(()=>{}); close(); };
  const askClose = () => {
    if (log.some((b) => b.sets.some((s) => s.done))) {
      Alert.alert('Salir del entrenamiento', 'Tienes series hechas. ¿Qué deseas hacer?', [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Guardar lo hecho', onPress: () => { try { finishSession({ allowActive: true }); } catch(e) {} } },
        { text: 'Descartar', style: 'destructive', onPress: () => { AsyncStorage.removeItem(DRAFT_KEY).catch(()=>{}); close(); } },
      ]);
    } else {
      Alert.alert('Salir del entrenamiento', 'Todavía no has hecho ninguna serie. ¿Salir?', [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => { AsyncStorage.removeItem(DRAFT_KEY).catch(()=>{}); close(); } },
      ]);
    }
  };

  const handleBack = () => {
    if (adjOpen) { setAdjOpen(false); return true; }
    if (why) { setWhy(null); return true; }
    if (saved) { closeAll(); return true; }
    askClose();
    return true;
  };

  useEffect(() => {
    if (!workoutBackRef) return;
    workoutBackRef.current = handleBack;
    return () => { if (workoutBackRef) workoutBackRef.current = null; };
  });

  const updSet = (ei, si, patch) => setLog((a) => a.map((b, x) => (x !== ei ? b : { ...b, sets: b.sets.map((s, k) => (k !== si ? s : { ...s, ...patch })) })));

  const applyWeight = (ei, kg) => {
    setLog((a) => a.map((b, x) => (x !== ei ? b : {
      ...b,
      manualWeightKg: kg,
      sets: b.sets.map((s) => (s.done ? s : { ...s, w: kg > 0 ? String(toU(kg, u)) : '' })),
    })));
  };

  const openAdjust = () => {
    const base = effectiveWeightKg != null && effectiveWeightKg > 0 ? toU(effectiveWeightKg, u) : stepW;
    setAdjValue(base);
    setAdjOpen(true);
  };

  const goNextExercise = () => {
    if (exIndex + 1 < log.length) {
      setExIndex((i) => i + 1);
      setSetIndex(0);
      setPhase('recommend');
      setStartedAt(null);
    } else {
      finishSession();
    }
  };

  const skipSet = () => {
    if (setIndex + 1 < totalSets) {
      setSetIndex((s) => s + 1);
      setPhase('recommend');
    } else if (completedSets === 0) {
      goNextExercise();
    } else {
      setPhase('summary');
    }
  };

  const startRunning = (si) => {
    const nowTs = Date.now();
    setStartedAt(nowTs);
    setSetIndex(si);
    updSet(exIndex, si, { startedAt: nowTs, endedAt: null, active: true });
    setNow(nowTs);
    setPhase('running');
  };

  const finishRunning = () => {
    if (!startedAt) return;
    const endedAt = Date.now();
    updSet(exIndex, setIndex, { endedAt, active: false });
    // prepare register
    const sSet = cur.sets[setIndex];
    const w = sSet.w;
    const r = sSet.r;
    setReg({ r: '', w: w || (effectiveWeightKg > 0 ? String(toU(effectiveWeightKg, u)) : ''), rir: null });
    setRegTouched(false);
    setPhase('register');
  };

  const cancelRunning = () => {
    updSet(exIndex, setIndex, { startedAt: null, endedAt: null, active: false });
    setStartedAt(null);
    setPhase('start');
  };

  const saveRegister = () => {
    if (!regTouched) {
      Alert.alert('Confirma la serie', 'Pulsa + o - para confirmar reps, peso o RIR.');
      return;
    }
    const s = cur.sets[setIndex];
    const startedAtTs = s.startedAt || startedAt || Date.now();
    const endedAtTs = s.endedAt || Date.now();
    const r = parseInt(String(reg.r).replace(',', '.')) || 0;
    if (!(r > 0)) {
      Alert.alert('Falta reps', 'Anota cuántas repeticiones hiciste antes de guardar la serie.');
      return;
    }
    const wDisp = String(reg.w).replace(',', '.');
    const wKg = fromU(parseFloat(wDisp) || 0, u);
    const rir = reg.rir === null || reg.rir === undefined || reg.rir === '' ? null : parseInt(reg.rir);
    let rb = null;
    if (setIndex !== 0) {
      for (let i = setIndex - 1; i >= 0; i--) {
        const pe = cur.sets[i];
        if (pe && pe.endedAt) {
          rb = Math.round((startedAtTs - pe.endedAt) / 1000);
          break;
        }
      }
      if (rb == null) rb = null;
    }
    updSet(exIndex, setIndex, {
      w: reg.w,
      r: String(r),
      rir,
      failure: rir === 0,
      startedAt: startedAtTs,
      endedAt: endedAtTs,
      restBeforeSec: rb,
      done: true,
      active: false,
    });
    // update reg weight into set already via w
    const nextSet = setIndex + 1;
    if (nextSet < totalSets) {
      setSetIndex(nextSet);
      setRestTarget(rec.restSec || 90);
      setRestStarted(endedAtTs);
      setPhase('rest');
    } else {
      setPhase('summary');
    }
    setStartedAt(null);
  };

  const backRegister = () => {
    updSet(exIndex, setIndex, { startedAt: null, endedAt: null, active: false });
    setStartedAt(null);
    setPhase('start');
  };

  const finishSession = (opts = {}) => {
    if (saved) return;
    if (!opts.allowActive && log.some((b) => b.sets.some((s) => s.active))) {
      Alert.alert('Serie en curso', 'Termina o cancela la serie antes de guardar.');
      return;
    }
    const endedAt = Date.now();
    const exercises = log.map((b) => ({
      exId: b.ex.id,
      name: b.ex.name,
      targetReps: b.rec.targetReps || b.ex.reps,
      targetSets: b.ex.sets,
      targetRestSec: b.rec.restSec,
      recWeightKg: b.manualWeightKg != null ? b.manualWeightKg : b.rec.weightKg,
      sets: b.sets.filter((s) => s.done && parseInt(s.r) > 0).map((s) => ({
        w: fromU(parseFloat(String(s.w).replace(',', '.')) || 0, u),
        r: parseInt(s.r),
        rir: s.rir,
        failure: s.rir === 0,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        restBeforeSec: s.restBeforeSec,
        pr: false,
      })),
    })).filter((e) => e.sets.length);
    if (!exercises.length) {
      Alert.alert('Sin series', 'Marca al menos una serie como hecha.');
      return;
    }
    const workout = {
      id: uid(),
      date: endedAt,
      routineId: routine.id,
      routineName: routine.name,
      startedAt: sessionStart.current,
      endedAt,
      durationSec: Math.max(1, Math.round((endedAt - sessionStart.current) / 1000)),
      exercises,
    };
    const records = newRecords(data, workout);
    records.forEach((r) => {
      const e = workout.exercises[r.exIndex];
      const s = e && e.sets[r.setIndex];
      if (s) s.pr = true;
    });
    const review = sessionReview(data, workout);
    workout.prs = records.map(({ exId, name, kind, weightKg, reps }) => ({ exId, name, kind, weightKg, reps }));
    workout.score = review;
    update((d) => ({ ...d, workouts: [workout, ...d.workouts] }));
    AsyncStorage.removeItem(DRAFT_KEY).catch(()=>{});
    setSaved({ review, records });
    setPhase('review');
  };

  useEffect(() => {
    try {
      if (log.some((b)=>b.sets.some((ss)=>ss.done))) {
        AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ routine, exIndex, setIndex, phase, ts: Date.now() })).catch(()=>{});
      }
    } catch(e) {}
  }, [log, exIndex, setIndex, phase]);

  const remainingRest = restStarted ? restTarget - Math.floor((now - restStarted) / 1000) : restTarget;
  const elapsedRest = restStarted ? Math.floor((now - restStarted) / 1000) : 0;
  const restOver = elapsedRest > restTarget;
  const restThreshold = Math.max(20, Math.round(restTarget * 0.2));
  const restAlert = restStarted && (elapsedRest - restTarget) > restThreshold;

  const exScore = phase === 'summary' ? exerciseReview(data, {
    exId: cur.ex.id,
    name: cur.ex.name,
    targetReps: rec.targetReps || cur.ex.reps,
    targetSets: cur.ex.sets,
    targetRestSec: rec.restSec,
    recWeightKg: effectiveWeightKg != null ? effectiveWeightKg : rec.weightKg,
    sets: cur.sets,
  }) : null;

  const bodyKg = Number(data.profile && data.profile.weightKg) || 0;
  const dbEx = null;
  // find met from exercises module
  // lazy import not; use require? We'll import at top. Add import exerciseById.
  // (handled below)

  const renderHeader = (title, subtitle, segments) => (
    <View style={{ backgroundColor: C.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <T style={{ fontSize: 17, fontWeight: '600' }}>{title}</T>
        <T style={{ fontSize: 13, color: C.mute, marginTop: 2 }}>{subtitle}</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <View key={i} style={{ width: 22, height: 6, borderRadius: 3, backgroundColor: i < (phase === 'rest' ? completedSets : setIndex + 1) ? C.accent : C.segmentOff }} />
        ))}
      </View>
    </View>
  );

const Ring = ({ progress, center, C }) => (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={290} height={290}>
        <Defs>
          <SvgGrad id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={C.gradRing0} />
            <Stop offset="1" stopColor={C.gradRing1} />
          </SvgGrad>
        </Defs>
        <Circle cx={145} cy={145} r={128} stroke={C.ringTrack} strokeWidth={14} fill="none" />
        <Circle cx={145} cy={145} r={128} stroke="url(#ringGrad)" strokeWidth={14} fill="none" strokeLinecap="round"
          strokeDasharray={`${Math.max(0, Math.min(1, progress)) * 804} 804`} transform="rotate(-90 145 145)" />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        {center}
      </View>
    </View>
  );


  const commonPad = { paddingTop: ins.top + 10, paddingHorizontal: 22, paddingBottom: Math.max(ins.bottom, 0) + 28 };

  if (phase === 'review') {
    return (
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: C.bg }}>
        <SessionReview
          visible={!!saved}
          review={saved ? saved.review : null}
          records={saved ? saved.records : []}
          onClose={closeAll}
        />
      </View>
    );
  }

  if (phase === 'recommend') {
    const noHist = !rec.weightKg && rec.weightKg !== 0; // null
    const bodyweight = rec.weightKg === 0;
    const rirTarget = Array.isArray(rec.rir) ? (rec.rir[1] ?? rec.rir[0] ?? 2) : 2;
    const rirStart = (4 - rirTarget) * 19.5;
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1 }}>
              <Press onPress={askClose} hitSlop={12} style={{ alignSelf: 'flex-start', padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={26} color={C.mute} /></Press>
              {renderHeader(cur.ex.name, `Serie ${setIndex + 1} de ${totalSets}`, totalSets)}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Coach mood="neutral" size="sm" />
                <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <T style={{ fontSize: 14, lineHeight: 20 }}>Esta es mi recomendación según tu historial. Puedes ajustarla.</T>
                </View>
              </View>
              <Card style={{ padding: 18, borderRadius: 26 }}>
                <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, letterSpacing: 1.2 }}>RECOMENDADO</T>
                {noHist ? (
                  <View style={{ marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Press onPress={() => setNoHistWeight((v) => Math.max(0, Math.round((v - stepW) * 10) / 10))} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="remove" size={22} color={C.text} />
                      </Press>
                      <T style={{ fontSize: 38, fontWeight: '700', letterSpacing: -1.1, fontVariant: ['tabular-nums'], flex: 1, textAlign: 'center' }}>{noHistWeight.toString().replace('.', ',')}</T>
                      <Press onPress={() => setNoHistWeight((v) => Math.round((v + stepW) * 10) / 10)} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="add" size={22} color={C.text} />
                      </Press>
                    </View>
                    <T style={{ fontSize: 12, color: C.mute, textAlign: 'center', marginTop: 4 }}>{u.toUpperCase()}</T>
                  </View>
                ) : bodyweight ? (
                  <T style={{ fontSize: 24, fontWeight: '700', marginTop: 6 }}>Peso corporal</T>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
                    <T style={{ fontSize: 78, fontWeight: '700', lineHeight: 82, fontVariant: ['tabular-nums'] }}>{toU(effectiveWeightKg, u)}</T>
                    <T style={{ fontSize: 22, fontWeight: '500', color: C.mute, marginLeft: 6 }}>{u}</T>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <T style={{ fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{cur.ex.sets}</T>
                    <T style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>series</T>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <T style={{ fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{rec.targetReps || cur.ex.reps}</T>
                    <T style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>repeticiones</T>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <T style={{ fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{mm(rec.restSec)}</T>
                    <T style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>descanso</T>
                  </View>
                </View>
                <View style={{ marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <T style={{ fontSize: 12, color: C.mute }}>Lejos</T>
                    <T style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>RIR {rirTarget} · a {rirTarget} reps del fallo</T>
                    <T style={{ fontSize: 12, color: C.mute }}>Al fallo</T>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden' }}>
                    <View style={{ height: 8, borderRadius: 4, width: '22%', backgroundColor: C.accent, marginLeft: `${rirStart}%` }} />
                  </View>
                </View>
              </Card>
              <Card style={{ padding: 14, borderRadius: 26 }}>
                <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, letterSpacing: 1.2, marginBottom: 6 }}>POR QUÉ</T>
                <T style={{ fontSize: 14, lineHeight: 20.3 }}>{rec.text}</T>
                <Press onPress={() => setWhy(rec.rules)} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                  <T style={{ fontSize: 13, fontWeight: '500', color: C.accent }}>Criterio de la app · Ver regla y fuente</T>
                </Press>
              </Card>
              {!!rec.warning && <T style={{ fontSize: 11, lineHeight: 16, color: C.warn }}>{rec.warning}</T>}
              {!!rec.restInsight && <T style={{ fontSize: 11, lineHeight: 16, color: C.warn }}>{rec.restInsight.text}</T>}
              <View style={{ flex: 1 }} />
              <Btn
                label={noHist ? 'Empezar con este peso' : (bodyweight ? 'Empezar' : `Usar ${toU(effectiveWeightKg, u)} ${u}`)}
                onPress={() => {
                  if (noHist) applyWeight(exIndex, fromU(noHistWeight, u));
                  setPhase('start');
                }}
              />
              <Btn kind="ghost" label="Ajustar" onPress={openAdjust} style={{ backgroundColor: C.ghost }} />
            </View>
          </ScrollView>
        </LinearGradient>
        {renderAdjust()}
        <RuleInfo visible={!!why} rules={why || []} onClose={() => setWhy(null)} />
      </Animated.View>
    );
  }

  if (phase === 'start') {
    const w = effectiveWeightKg;
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1 }}>
              <Press onPress={askClose} hitSlop={12} style={{ alignSelf: 'flex-start', padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={26} color={C.mute} /></Press>
              {renderHeader(cur.ex.name, `Serie ${setIndex + 1} de ${totalSets}`, totalSets)}
              <View style={{ alignItems: 'center' }}>
                <Coach mood="neutral" size="sm" />
              </View>
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Ring C={C} progress={0} center={
                  <LinearGradient colors={[C.gradPlay0, C.gradPlay1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' }}>
                    <Press onPress={() => startRunning(setIndex)} style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="play" size={46} color={C.playTriangle} />
                    </Press>
                  </LinearGradient>
                } />
              </View>
              <View style={{ alignItems: 'center' }}>
                <T style={{ fontSize: 24, fontWeight: '700', letterSpacing: -0.5 }}>Toca para iniciar</T>
                <T style={{ fontSize: 15, color: C.mute, marginTop: 6 }}>
                  {w != null && w > 0 ? `${toU(w, u)} ${u}` : (w === 0 ? 'peso corporal' : 'elige peso')} × {rec.targetReps || cur.ex.reps} · el cronómetro empieza al tocar
                </T>
              </View>
              <View style={{ flex: 1 }} />
              <Btn kind="ghost" label="Saltar serie" onPress={skipSet} style={{ backgroundColor: C.ghost, alignSelf: 'center', paddingHorizontal: 24 }} />
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (phase === 'running') {
    const secs = startedAt ? (now - startedAt) / 1000 : 0;
    const progress = Math.min(secs / 60, 1);
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1 }}>
              <Press onPress={askClose} hitSlop={12} style={{ alignSelf: 'flex-start', padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={26} color={C.mute} /></Press>
              {renderHeader(cur.ex.name, `Serie ${setIndex + 1} de ${totalSets}`, totalSets)}
              <View style={{ alignItems: 'center' }}>
                <Coach mood="neutral" size="sm" />
              </View>
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Ring C={C} progress={progress} center={
                  <View style={{ alignItems: 'center' }}>
                    <T style={{ fontSize: 14, color: C.mute }}>Tiempo habitual 25 a 45 s</T>
                    <T style={{ fontSize: 64, fontWeight: '700', letterSpacing: -1.9, fontVariant: ['tabular-nums'], marginTop: 4 }}>{mm(secs)}</T>
                    <T style={{ fontSize: 12, color: C.mute, marginTop: 4 }}>criterio de la app</T>
                  </View>
                } />
              </View>
              <View style={{ flex: 1 }} />
              <Btn label="Terminar serie" onPress={finishRunning} />
              <Btn kind="ghost" label="Cancelar serie" onPress={cancelRunning} style={{ backgroundColor: C.ghost }} />
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (phase === 'register') {
    const rir = reg.rir;
    const repsNum = parseInt(String(reg.r)) || 0;
    const targetReps = rec.targetReps || cur.ex.reps || 0;
    const happy = repsNum >= targetReps && (rir === null || (rir >= 1 && rir <= 3));
    const alertMood = rir === 0 && repsNum < targetReps;
    const mood = alertMood ? 'alert' : (happy ? 'happy' : 'neutral');
    const bubble = alertMood
      ? 'Llegaste al fallo. Mantenemos el peso y buscamos margen.'
      : (happy ? `${rir ?? 2} repeticiones de reserva. Justo lo recomendado.` : 'Anota lo que hiciste para ajustar la próxima.');
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1 }}>
              <Press onPress={askClose} hitSlop={12} style={{ alignSelf: 'flex-start', padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={26} color={C.mute} /></Press>
              {renderHeader(cur.ex.name, 'Registra tu serie', totalSets)}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Coach mood={mood} size="sm" />
                <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <T style={{ fontSize: 14, lineHeight: 20 }}>{bubble}</T>
                </View>
              </View>
              {/* Reps stepper */}
              <View style={{ backgroundColor: C.card, borderRadius: 26, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: C.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <T style={{ fontSize: 13, color: C.mute }}>Reps</T>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <T style={{ fontSize: 38, fontWeight: '700', letterSpacing: -1.1, fontVariant: ['tabular-nums'] }}>{reg.r === '' ? '-' : reg.r}</T>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, r: String(Math.max(0, (parseInt(p.r) || 0) - 1)) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="remove" size={22} color={C.text} />
                    </Press>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, r: String((parseInt(p.r) || 0) + 1) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="add" size={22} color={C.text} />
                    </Press>
                  </View>
                </View>
              </View>
              {/* Weight stepper */}
              <View style={{ backgroundColor: C.card, borderRadius: 26, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: C.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <T style={{ fontSize: 13, color: C.mute }}>Peso</T>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <T style={{ fontSize: 38, fontWeight: '700', letterSpacing: -1.1, fontVariant: ['tabular-nums'] }}>{reg.w.toString().replace('.', ',')}</T>
                      <T style={{ fontSize: 16, color: C.mute, fontWeight: '500' }}>{u}</T>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, w: String(Math.max(0, Math.round(((parseFloat(String(p.w).replace(',', '.')) || 0) - stepW) * 10) / 10)) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="remove" size={22} color={C.text} />
                    </Press>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, w: String(Math.round(((parseFloat(String(p.w).replace(',', '.')) || 0) + stepW) * 10) / 10) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="add" size={22} color={C.text} />
                    </Press>
                  </View>
                </View>
              </View>
              {/* RIR stepper */}
              <View style={{ backgroundColor: C.card, borderRadius: 26, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1, borderColor: C.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <T style={{ fontSize: 13, color: C.mute }}>RIR</T>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <T style={{ fontSize: 38, fontWeight: '700', letterSpacing: -1.1, fontVariant: ['tabular-nums'] }}>{rir === null ? '—' : rir}</T>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, rir: p.rir === null ? 0 : Math.max(0, p.rir - 1) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="remove" size={22} color={C.text} />
                    </Press>
                    <Press onPress={() => { setRegTouched(true); setReg((p) => ({ ...p, rir: p.rir === null ? 1 : Math.min(5, p.rir + 1) })); }} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="add" size={22} color={C.text} />
                    </Press>
                  </View>
                </View>
              </View>
              <View style={{ flex: 1 }} />
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Press onPress={backRegister} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ fontSize: 22, color: C.text }}>←</T>
                </Press>
                <Btn label="Guardar serie →" onPress={saveRegister} style={{ flex: 1 }} />
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (phase === 'rest') {
    const progress = Math.min(elapsedRest / Math.max(1, restTarget), 1);
    const nextSetNum = setIndex + 1;
    const w = effectiveWeightKg;
    const reps = rec.targetReps || cur.ex.reps;
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1 }}>
              <Press onPress={askClose} hitSlop={12} style={{ alignSelf: 'flex-start', padding: 10, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-down" size={26} color={C.mute} /></Press>
              {renderHeader('Descanso', `Después de la serie ${completedSets}`, totalSets)}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Coach mood={restAlert ? 'alert' : 'neutral'} size="sm" />
                <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <T style={{ fontSize: 14, lineHeight: 20 }}>
                    {restAlert
                      ? `Llevas ${mm(elapsedRest)} de descanso; el objetivo era ${mm(restTarget)}. Cuando estés listo, empieza.`
                      : 'Respira. Te aviso si te desvías más del 20 % del objetivo.'}
                  </T>
                </View>
              </View>
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <Ring C={C} progress={progress} center={
                  <View style={{ alignItems: 'center' }}>
                    <T style={{ fontSize: 14, color: C.mute }}>Descansando</T>
                    <T style={{ fontSize: 64, fontWeight: '700', letterSpacing: -1.9, fontVariant: ['tabular-nums'], marginTop: 4 }}>{mm(elapsedRest)}</T>
                    <T style={{ fontSize: 14, color: C.mute, marginTop: 4 }}>objetivo {mm(restTarget)}</T>
                  </View>
                } />
              </View>
              <Card style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 26 }}>
                <T style={{ fontSize: 12, fontWeight: '600', color: C.mute, letterSpacing: 1.2 }}>SIGUE</T>
                <T style={{ fontSize: 15, fontWeight: '700', marginTop: 4 }}>Serie {nextSetNum} · {w != null && w > 0 ? `${toU(w, u)} ${u}` : 'peso corporal'} × {reps}</T>
              </Card>
              <View style={{ flex: 1 }} />
              <Btn label={`Empezar serie ${nextSetNum}`} onPress={() => startRunning(setIndex)} />
              <Btn kind="ghost" label="Añadir 30 s" onPress={() => setRestTarget((t) => t + 30)} style={{ backgroundColor: C.ghost }} />
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (phase === 'summary') {
    const sc = exScore;
    const mood = sc && sc.score >= 75 ? 'happy' : 'neutral';
    const kcalLine = (() => {
      if (!bodyKg) return 'Agrega tu peso en el perfil para ver kcal.';
      // find met: import exerciseById
      const db = exerciseById(cur.ex.id);
      const met = db ? db.met : 3.5;
      const first = cur.sets.find((s) => s.startedAt);
      const last = [...cur.sets].reverse().find((s) => s.endedAt);
      const sec = first && last ? Math.max(0, (last.endedAt - first.startedAt) / 1000) : 0;
      const kcal = met * bodyKg * (sec / 3600);
      return `≈ ${Math.round(kcal)} kcal estimadas (MET × peso × horas).`;
    })();
    const finalText = sc && sc.score >= 75 ? 'Cumpliste con margen.' : (sc && sc.score >= 60 ? 'Aceptable.' : 'A revisar el ritmo.');
    const isLast = exIndex === log.length - 1;
    return (
      <Animated.View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, transform: [{ translateY: y }] }}>
        <LinearGradient colors={[C.bgTop, C.bgBot]} locations={[0, 0.38]} style={{ flex: 1, ...commonPad }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 16, flex: 1, alignItems: 'center' }}>
              <View style={{ marginTop: 6 }}>
                <Coach mood={mood} size="lg" />
              </View>
              <View style={{ alignItems: 'center' }}>
                <T style={{ fontSize: 14, color: C.mute }}>{cur.ex.name} · completado</T>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <T style={{ fontSize: 70, fontWeight: '700', letterSpacing: -2.1, fontVariant: ['tabular-nums'] }}>{sc ? sc.score : 0}</T>
                  <T style={{ fontSize: 16, color: C.mute }}>de 100</T>
                </View>
                <T style={{ fontSize: 12, color: C.mute }}>criterio de la app</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 14, width: '100%' }}>
                {(sc ? sc.components : []).map((c) => {
                  const pct = Math.round(c.value * 100);
                  return (
                    <View key={c.key} style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <T style={{ fontSize: 13, color: C.mute }}>{c.label === 'Reps' ? 'Reps' : c.label === 'Peso' ? 'Peso' : 'Descanso'}</T>
                        <T style={{ fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{pct}%</T>
                      </View>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: C.track, overflow: 'hidden' }}>
                        <View style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: C.accent }} />
                      </View>
                    </View>
                  );
                })}
              </View>
              <Card style={{ width: '100%', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 26 }}>
                {cur.sets.filter((s) => s.done).map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.line }}>
                    <T style={{ fontSize: 13, color: C.mute, width: 60 }}>Serie {i + 1}</T>
                    <T style={{ fontSize: 14, fontWeight: '700', flex: 1, fontVariant: ['tabular-nums'] }}>{toU(parseFloat(String(s.w).replace(',', '.')) || 0, u)} × {s.r}</T>
                    <T style={{ fontSize: 13, color: C.mute, width: 50, textAlign: 'right' }}>RIR {s.rir === null ? '—' : s.rir}</T>
                  </View>
                ))}
              </Card>
              <T style={{ fontSize: 13, color: C.mute, textAlign: 'center' }}>{kcalLine} {finalText}</T>
              <View style={{ flex: 1 }} />
              <Btn label={isLast ? 'Terminar sesión' : 'Siguiente ejercicio'} onPress={() => { if (isLast) finishSession(); else goNextExercise(); }} />
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  }

  return null;

  function renderAdjust() {
    if (!adjOpen) return null;
    return (
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: Math.max(ins.bottom, 16) }}>
          <T style={{ fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Ajustar peso</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Press onPress={() => setAdjValue((v) => Math.max(0, Math.round((v - stepW) * 10) / 10))} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="remove" size={22} color={C.text} />
            </Press>
            <T style={{ flex: 1, textAlign: 'center', fontSize: 38, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{adjValue.toString().replace('.', ',')}</T>
            <Press onPress={() => setAdjValue((v) => Math.round((v + stepW) * 10) / 10)} hitSlop={6} style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: C.stepBtn, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={22} color={C.text} />
            </Press>
          </View>
          <T style={{ fontSize: 12, color: C.mute, textAlign: 'center', marginBottom: 12 }}>{u.toUpperCase()}</T>
          <Btn label="Usar este peso" onPress={() => { applyWeight(exIndex, fromU(adjValue, u)); setAdjOpen(false); }} />
          <Press onPress={() => setAdjOpen(false)} style={{ marginTop: 10, alignSelf: 'center' }}>
            <T style={{ fontSize: 13, color: C.mute }}>Cancelar</T>
          </Press>
        </View>
      </View>
    );
  }
}
