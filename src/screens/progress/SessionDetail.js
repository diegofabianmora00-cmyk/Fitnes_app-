import React, { useState } from 'react';
import { Modal, ScrollView, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { C } from '../../theme';
import { Card, Press, T, Btn } from '../../ui';
import { toU, useStore } from '../../store';
import Coach from '../../Coach';
import { sessionProgress, sessionReview } from '../../recommend';

const fmtDateFull = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
};

const clock = (sec) => `${Math.floor((sec || 0) / 60)} min`;

export default function SessionDetail({ visible, workout, onClose, initialFocusComment = false }) {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const [comment, setComment] = useState(() => (workout ? (workout.comment || '') : ''));
  const unit = data.unit || 'kg';

  if (!workout) return null;

  const review = workout.score && Number(workout.score.v) === 3 ? workout.score : sessionReview(data, workout);
  const scoreVal = review.score || 0;
  const components = review.components || [];

  const progressDiff = sessionProgress(data, workout);
  const coachText = progressDiff !== null
    ? (progressDiff >= 0 ? `Mejoraste ${progressDiff} puntos respecto a tu sesión anterior de esta rutina.` : `Bajaste ${Math.abs(progressDiff)} puntos respecto a tu sesión anterior. ¡A recuperar terreno!`)
    : '¡Excelente sesión! Sigue manteniendo la constancia.';

  // Ring calculation
  const radius = 82;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (scoreVal / 100) * circ;

  const handleSave = () => {
    update((d) => ({
      ...d,
      workouts: (d.workouts || []).map((w) => (w.id === workout.id ? { ...w, comment } : w)),
    }));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ flex: 1, paddingTop: ins.top }}>
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: Math.max(ins.bottom, 20) + 20 }}>
            {/* Top row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Press
                onPress={onClose}
                accessibilityLabel="Volver"
                style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="arrow-back" size={24} color={C.text} />
              </Press>
              <Card style={{ flex: 1, padding: 12 }}>
                <T style={{ fontSize: 17, fontWeight: '700' }} numberOfLines={1}>{workout.routineName}</T>
                <T mute style={{ fontSize: 13, marginTop: 2 }}>{fmtDateFull(workout.date)} · {clock(workout.durationSec)}</T>
              </Card>
            </View>

            {/* Score ring */}
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <View style={{ width: 190, height: 190, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width="190" height="190">
                  <Circle cx="95" cy="95" r={radius} stroke={C.ringTrack} strokeWidth="12" fill="none" />
                  <Circle
                    cx="95"
                    cy="95"
                    r={radius}
                    stroke={C.accent}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={circ}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 95 95)"
                  />
                </Svg>
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <T style={{ fontSize: 56, fontWeight: '800', color: C.accent, lineHeight: 62 }}>{scoreVal}</T>
                  <T mute style={{ fontSize: 15 }}>de 100</T>
                  <T style={{ fontSize: 14, fontWeight: '700', color: scoreVal >= 75 ? C.accent : scoreVal >= 60 ? C.warn : C.danger, marginTop: 2 }}>{review.grade}</T>
                </View>
              </View>
            </Card>

            {/* Compliance card */}
            <Card style={{ padding: 18, marginTop: 12 }}>
              <T style={{ fontWeight: '700', fontSize: 16, marginBottom: 14 }}>Cómo se compone tu puntaje</T>
              <View style={{ gap: 14 }}>
                {components.map((c) => {
                  const pct = Math.round(c.value * 100);
                  const label = c.label;
                  const color = c.value >= 0.8 ? C.accent : c.value >= 0.5 ? C.warn : C.danger;
                  return (
                    <View key={c.key}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <T mute style={{ fontSize: 14 }}>{label}</T>
                        <T style={{ fontSize: 14, fontWeight: '700' }}>{pct}%</T>
                      </View>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: C.segmentOff }}>
                        <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: color }} />
                      </View>
                    </View>
                  );
                })}
              </View>
              {!!(review.missed && review.missed.length) && (
                <T mute style={{ fontSize: 12, lineHeight: 17, marginTop: 12 }}>
                  Faltaron del plan: {review.missed.map((m) => m.name).join(', ')}.
                </T>
              )}
              {!!review.partial && (
                <T mute style={{ fontSize: 11, lineHeight: 16, marginTop: 8 }}>
                  Sesión antigua: el puntaje se recalculó con los datos disponibles.
                </T>
              )}
            </Card>

            {/* Coach message */}
            <Card style={{ padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                <Coach mood="happy" size="sm" />
              </View>
              <T style={{ flex: 1, fontSize: 14, color: C.softText, lineHeight: 20 }}>{coachText}</T>
            </Card>

            {/* Exercises list */}
            <T style={{ fontSize: 20, fontWeight: '700', marginTop: 22, marginBottom: 10 }}>Ejercicios</T>
            <View style={{ gap: 10 }}>
              {(workout.exercises || []).map((e, idx) => {
                const bestSet = (e.sets || []).filter((s) => !s.unconfirmed && Number(s.r) > 0)[0] || (e.sets || [])[0];
                const setsCount = (e.sets || []).filter((s) => !s.unconfirmed && Number(s.r) > 0).length;
                const weightDisplay = bestSet && bestSet.w > 0 ? `${toU(bestSet.w, unit)} ${unit}` : 'peso corporal';
                const hasPr = (workout.prs || []).some((pr) => pr.exId === e.exId);

                return (
                  <Card key={`${e.exId}-${idx}`} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <T style={{ fontSize: 16, fontWeight: '700' }}>{e.name}</T>
                      <T mute style={{ fontSize: 13, marginTop: 4 }}>{setsCount} × {bestSet ? bestSet.r : 8} · {weightDisplay}</T>
                    </View>
                    {hasPr && (
                      <View style={{ backgroundColor: C.accentDim, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <T style={{ fontSize: 11, fontWeight: '700', color: C.accent, letterSpacing: 0.06 * 11 }}>RÉCORD</T>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>

            {/* Comment */}
            <Card style={{ padding: 16, marginTop: 16 }}>
              <T style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Comentario</T>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                autoFocus={initialFocusComment}
                placeholder="Escribe cómo te sentiste, qué cambiarías o qué notaste…"
                placeholderTextColor={C.muteText}
                style={{
                  height: 110,
                  backgroundColor: C.field,
                  borderWidth: 1,
                  borderColor: C.line,
                  borderRadius: 14,
                  padding: 12,
                  color: C.text,
                  fontSize: 15,
                  textAlignVertical: 'top',
                }}
              />
              <T mute style={{ fontSize: 13, marginTop: 8 }}>Puedes escribirlo durante el entreno y editarlo aquí cuando quieras.</T>
            </Card>

            <Btn label="Guardar comentario" onPress={handleSave} style={{ marginTop: 22 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
