import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={26} color={C.accentText} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 16, fontWeight: '700', color: C.accent }}>¡Misión cumplida!</T>
                <T style={{ fontSize: 14, marginTop: 2, color: C.text }}>Ya cumpliste con tu sesión de entrenamiento del día.</T>
              </View>
            </View>
          </Card>
        </FadeIn>
      ) : todaysRoutine ? (
        <FadeIn delay={250}>
          <Card style={{ marginTop: 14, padding: 18 }}>
            <T mute>Tu rutina de hoy</T>
            <T style={{ fontSize: 22, fontWeight: '700', marginTop: 2 }}>{todaysRoutine.name}</T>
            <T mute style={{ marginTop: 4 }}>
              {todaysRoutine.exercises.length} ejercicios · ~{Math.max(1, Math.round(todaysRoutine.exercises.reduce((acc, ex) => acc + (Number(ex.sets) || todaysRoutine.defaults?.sets || 3) * (todaysRoutine.defaults?.restSec || 120), 0) / 60))} min
            </T>
            <Btn label="Empezar entrenamiento" onPress={() => start(todaysRoutine)} style={{ marginTop: 16, minHeight: 56, borderRadius: 24 }} />
          </Card>
        </FadeIn>
      ) : (
        <>
          <FadeIn delay={250}>
            <TodayGoal
              nextRoutineInfo={nextRoutineInfo}
              checkin={checkin}
              onCheckin={handleCheckin}
            />
          </FadeIn>

          <FadeIn delay={300}>
            <TomorrowCard
              data={data}
              nextRoutineInfo={nextRoutineInfo}
              onGoRoutines={() => go('routines')}
            />
          </FadeIn>

          <FadeIn delay={350}>
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
    </>
  );
}
