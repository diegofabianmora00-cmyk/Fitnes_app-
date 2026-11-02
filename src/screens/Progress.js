import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { FadeIn, H, T } from '../ui';
import { useStore } from '../store';
import { periodRange, periodStats } from '../recommend';

import StreakCard from './progress/StreakCard';
import PeriodPicker from './progress/PeriodPicker';
import ProgressChart from './progress/ProgressChart';
import StatGrid from './progress/StatGrid';
import CoachCard from './progress/CoachCard';
import PrCard from './progress/PrCard';
import MuscleCard from './progress/MuscleCard';
import HistoryList from './progress/HistoryList';
import EmptyProgress from './progress/EmptyProgress';

export default function Progress() {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const workouts = data.workouts || [];

  const [period, setPeriod] = useState('30 días');
  const [customRange, setCustomRange] = useState({ desde: '2026-09-01', hasta: '2026-10-31' });
  const [selectedExId, setSelectedExId] = useState(null);

  const hoyMs = Date.now();
  const rango = periodRange(period, hoyMs, customRange.desde, customRange.hasta);
  const stats = periodStats(data, rango, selectedExId);

  const handleStartWorkout = () => {
    // If no routines, prompt or navigate to routines
  };

  if (workouts.length === 0) {
    return (
      <EmptyProgress
        onStartWorkout={handleStartWorkout}
        onGoRoutines={() => {}}
      />
    );
  }

  const periodSubtitle = `${stats.sessions} sesiones en este periodo`;

  return (
    <ScrollView
      style={{ width: '100%' }}
      contentContainerStyle={{ padding: 22, paddingBottom: Math.max(ins.bottom, 20) + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <FadeIn>
        <View style={{ marginBottom: 4 }}>
          <H>Progreso</H>
          <T mute style={{ fontSize: 14, marginTop: 2 }}>{periodSubtitle}</T>
        </View>
      </FadeIn>

      <FadeIn delay={40}>
        <StreakCard data={data} />
      </FadeIn>

      <FadeIn delay={80}>
        <PeriodPicker
          period={period}
          setPeriod={setPeriod}
          customRange={customRange}
          setCustomRange={setCustomRange}
        />
      </FadeIn>

      <FadeIn delay={120}>
        <ProgressChart
          data={data}
          rango={rango}
          stats={stats}
          selectedExId={selectedExId}
          setSelectedExId={setSelectedExId}
        />
      </FadeIn>

      <FadeIn delay={160}>
        <CoachCard data={data} onSelectExercise={(id) => setSelectedExId(id)} />
      </FadeIn>

      <FadeIn delay={200}>
        <StatGrid stats={stats} />
      </FadeIn>

      <FadeIn delay={240}>
        <PrCard data={data} />
      </FadeIn>

      <FadeIn delay={280}>
        <MuscleCard data={data} rango={rango} />
      </FadeIn>

      <FadeIn delay={320}>
        <HistoryList data={data} />
      </FadeIn>
    </ScrollView>
  );
}
