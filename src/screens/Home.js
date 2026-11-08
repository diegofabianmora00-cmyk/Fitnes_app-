import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, H, Press, T } from '../ui';
import Coach, { COACH } from '../Coach';
import { useStore, routinesForDay } from '../store';
import { coachMessage, weekSummary, nextRoutineDay, nearRecord } from '../recommend';
import { calculateFacts, getCoachMessage } from '../coachMemory';
import RuleInfo from '../RuleInfo';

import DayHeader from './home/DayHeader';
import AtlasMessage from './home/AtlasMessage';
import TodayGoal from './home/TodayGoal';
import TomorrowCard from './home/TomorrowCard';
import NearRecordCard from './home/NearRecordCard';
import QuickSummary from './home/QuickSummary';

export default function Home({ go, start, isActive }) {
  const { data, update } = useStore();
  const [why, setWhy] = useState(null);
  const [coachMsg, setCoachMsg] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const lastIdRef = useRef(null);

  useEffect(() => {
    if (isActive === false) return;
    try {
      const facts = calculateFacts(data);
      const tone = data.profile?.tone || 'tranquilo';
      const recent = data.coachMemory || [];
      const ctx = facts.daysSinceLast >= 3 ? 'regreso_ausencia' : 'inicio';
      const res = getCoachMessage(ctx, facts, tone, recent);
      const mood = facts.daysSinceLast >= 3 ? 'alert' : (facts.improvedExercises?.length ? 'happy' : 'neutral');
      if (lastIdRef.current !== res.id) {
        lastIdRef.current = res.id;
        setCoachMsg({ mood, text: res.texto, rule: null, rules: [] });
        update(d => {
          const mem = [...(d.coachMemory || []), res.id].slice(-8);
          if (d.coachMemory && d.coachMemory[d.coachMemory.length - 1] === res.id) return d;
          return { ...d, coachMemory: mem };
        });
      }
    } catch (e) {}
  }, [isActive, data.profile?.tone]);

  const fallbackMsg = coachMessage(data);
  const msg = coachMsg || fallbackMsg;
  const summary = weekSummary(data);

  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // 0 = Lunes, ..., 6 = Domingo
  const todayRoutines = routinesForDay(data, dayIndex);
  const todaysRoutine = todayRoutines.length > 0 ? todayRoutines[0] : null;

  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayStart.getDate() + 1);
  const alreadyTrainedToday = data.workouts.some(w => w.date >= todayStart.getTime() && w.date < todayEnd.getTime());

  const unit = data.unit || 'kg';
  const nextRoutineInfo = nextRoutineDay(data, now.getTime());
  const recordInfo = nearRecord(data, now.getTime());

  const todayStr = now.toISOString().split('T')[0];
  const checkin = data.checkin && data.checkin.date === todayStr ? data.checkin.level : null;

  const handleCheckin = (level) => {
    update(d => ({
      ...d,
      checkin: level ? { date: todayStr, level } : null
    }));
  };

  const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekDays = 'LMXJVSD'.split('').map((l, i) => {
    const a = mon.getTime() + i * 864e5;
    return { l, done: data.workouts.some((w) => w.date >= a && w.date < a + 864e5) };
  });

  const isRestDay = !alreadyTrainedToday && !todaysRoutine;

  return (
    <>
    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <FadeIn>
        <DayHeader title={isRestDay ? 'Hoy toca descansar' : 'Hoy toca entrenar'} />
      </FadeIn>

      <AtlasMessage msg={msg} onWhy={() => setWhy(msg.rules)} />

      {alreadyTrainedToday ? (
        <FadeIn delay={250}>
          <Card style={{ marginTop: 14, backgroundColor: C.accentDim, borderColor: C.accent, borderWidth: 1, padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={26} color={C.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 16, fontWeight: '700', color: C.accent }}>¡Misión cumplida!</T>
                <T style={{ fontSize: 14, marginTop: 2, color: C.text }}>Ya cumpliste con tu sesión de entrenamiento del día.</T>
              </View>
            </View>
            <Btn kind="ghost" label="Entrenar otra rutina de todos modos..." onPress={() => setShowPicker(true)} style={{ minHeight: 44 }} />
          </Card>
        </FadeIn>
      ) : todaysRoutine ? (
        <FadeIn delay={250}>
          <Card style={{ marginTop: 14, padding: 18 }}>
            <T mute>Tu rutina de hoy</T>
            <T style={{ fontSize: 22, fontWeight: '700', marginTop: 2 }}>{todaysRoutine.name}</T>
            <T mute style={{ marginTop: 4, marginBottom: 16 }}>
              {todaysRoutine.exercises.length} ejercicios · ~{Math.max(1, Math.round(todaysRoutine.exercises.reduce((acc, ex) => {
                const manual = ex.mode === 'manual';
                const sets = manual ? (Number(ex.sets) || todaysRoutine.defaults?.sets || 3) : (todaysRoutine.defaults?.sets || 3);
                const rest = manual ? (Number(ex.restSec) || todaysRoutine.defaults?.restSec || 120) : (todaysRoutine.defaults?.restSec || 120);
                return acc + sets * rest;
              }, 0) / 60))} min
            </T>
            <View style={{ gap: 10 }}>
              <Btn label="🚀 Iniciar" onPress={() => start(todaysRoutine)} style={{ minHeight: 52, borderRadius: 20 }} />
              <Btn kind="ghost" label="Elegir otra rutina de la semana..." onPress={() => setShowPicker(true)} style={{ minHeight: 44, borderRadius: 16 }} />
            </View>
          </Card>
        </FadeIn>
      ) : (
        <>
          <FadeIn delay={250}>
            <Card style={{ marginTop: 14, padding: 18, backgroundColor: C.card, borderColor: C.accent, borderWidth: 1 }}>
              <T mute>Día de descanso o sin rutina asignada</T>
              <T style={{ fontSize: 20, fontWeight: '700', marginTop: 2, marginBottom: 8 }}>¿Listo para entrenar hoy?</T>
              <T mute style={{ fontSize: 13, marginBottom: 16 }}>Puedes iniciar cualquier rutina de tu semana cuando quieras.</T>
              <Btn label="🚀 Iniciar entrenamiento" onPress={() => setShowPicker(true)} style={{ minHeight: 50, borderRadius: 20 }} />
            </Card>
          </FadeIn>

          <FadeIn delay={280}>
            <TodayGoal
              nextRoutineInfo={nextRoutineInfo}
              checkin={checkin}
              onCheckin={handleCheckin}
            />
          </FadeIn>

          <FadeIn delay={320}>
            <TomorrowCard
              data={data}
              nextRoutineInfo={nextRoutineInfo}
              onGoRoutines={() => go('routines')}
            />
          </FadeIn>

          <FadeIn delay={360}>
            <NearRecordCard recordInfo={recordInfo} unit={unit} />
          </FadeIn>

          <FadeIn delay={400}>
            <QuickSummary data={data} />
          </FadeIn>
        </>
      )}

      {!isRestDay && (
        <FadeIn delay={350}>
          <Card style={{ marginTop: 14, padding: 18 }}>
            <T mute style={{ marginBottom: 12 }}>Esta semana</T>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {weekDays.map((d, i) => (
                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: d.done ? C.accent : C.card2 }} />
                  <T mute style={{ fontSize: 12 }}>{d.l}</T>
                </View>
              ))}
            </View>
            <T mute style={{ fontSize: 12, lineHeight: 18, marginTop: 12 }}>
              {summary.sessions} de {summary.target} entrenos esta semana
              {summary.prs ? ` · ${summary.prs} récord${summary.prs === 1 ? '' : 's'}` : ''}
              {summary.up ? ` · ${summary.up} listo${summary.up === 1 ? '' : 's'} para subir` : ''}
              {summary.stall ? ` · ${summary.stall} por revisar` : ''}
            </T>
          </Card>
        </FadeIn>
      )}
    </ScrollView>
    <RuleInfo visible={!!why} rules={why || []} onClose={() => setWhy(null)} />

    {/* Modal para elegir rutina */}
    <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
      <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '80%', backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16, paddingBottom: 24, paddingHorizontal: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <T style={{ fontSize: 20, fontWeight: '700' }}>Seleccionar Rutina</T>
            <Press onPress={() => setShowPicker(false)} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={22} color={C.text} />
            </Press>
          </View>
          <T mute style={{ fontSize: 13, marginBottom: 14 }}>Elige cualquier rutina guardada para iniciar tu sesión:</T>
          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            {(!data.routines || data.routines.length === 0) ? (
              <Card style={{ padding: 16, alignItems: 'center' }}>
                <T mute style={{ textAlign: 'center', marginBottom: 12 }}>No tienes rutinas creadas todavía.</T>
                <Btn label="Crear rutina" onPress={() => { setShowPicker(false); go('routines'); }} />
              </Card>
            ) : (
              data.routines.map((r) => (
                <Card key={r.id} style={{ marginBottom: 12, padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <T style={{ fontSize: 17, fontWeight: '700' }}>{r.name}</T>
                    {r.days && r.days.includes(dayIndex) && (
                      <View style={{ backgroundColor: C.accentDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <T style={{ fontSize: 11, fontWeight: '700', color: C.accent }}>Hoy</T>
                      </View>
                    )}
                  </View>
                  <T mute style={{ fontSize: 13, marginBottom: 12 }}>{r.exercises.length} ejercicios · Objetivo: {r.goal}</T>
                  <Btn
                    label="Iniciar esta rutina"
                    onPress={() => {
                      setShowPicker(false);
                      start(r);
                    }}
                    style={{ minHeight: 44, borderRadius: 16 }}
                  />
                </Card>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
    </>
  );
}
