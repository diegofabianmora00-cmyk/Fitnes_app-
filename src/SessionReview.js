import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';
import { Btn, Card, Press, T } from './ui';
import { RULES } from './recommend';
import { workoutKcal } from './exercises';
import { toU, useStore } from './store';
import Coach from './Coach';

const H = Dimensions.get('window').height;
const COLORS = [C.accent, C.warn, C.danger, '#6BCBFF'];
const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.abs(sec) % 60).padStart(2, '0')}`;

function Confetti() {
  const parts = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({
      left: (i * 37) % 100,
      color: COLORS[i % COLORS.length],
      size: 6 + (i % 5) * 2,
      delay: (i % 7) * 60,
      rot: ((i * 53) % 360) - 180,
    })),
    [],
  );
  const vals = useRef(parts.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    vals.forEach((v) => v.setValue(0));
    const anim = Animated.stagger(
      35,
      vals.map((v, i) => Animated.timing(v, {
        toValue: 1,
        duration: 1300 + ((i * 97) % 700),
        delay: parts[i].delay,
        useNativeDriver: true,
      })),
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {parts.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -24,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.62,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: vals[i].interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: vals[i].interpolate({ inputRange: [0, 1], outputRange: [0, H * 0.9] }) },
              { rotate: vals[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

function Mark({ item, unit }) {
  const weight = item.weightKg > 0 ? `${toU(item.weightKg, unit)} ${unit}` : null;
  const text = item.kind === 'weight'
    ? `${weight} × ${item.reps}`
    : `${item.reps} reps${weight ? ` con ${weight}` : ''}`;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="trophy-outline" size={17} color={C.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontWeight: '700' }}>{item.name || 'Ejercicio'}</T>
        <T mute style={{ fontSize: 13, marginTop: 1 }}>{text}</T>
      </View>
    </View>
  );
}

export default function SessionReview({ visible, review, records = [], workout = null, onClose }) {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const [step, setStep] = useState(records.length ? 0 : 1);
  const [showScore, setShowScore] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [comment, setComment] = useState(() => (workout ? (workout.comment || '') : ''));
  const unit = data.unit;
  const bodyKg = Number(data.profile && data.profile.weightKg) || 0;
  const kcal = workout ? workoutKcal(workout, bodyKg) : 0;

  useEffect(() => {
    if (visible) {
      setStep(records.length ? 0 : 1);
      setShowScore(false);
      setShowRest(false);
      setComment(workout ? (workout.comment || '') : '');
    }
  }, [visible, records, workout]);

  const handleCommentChange = (text) => {
    setComment(text);
    if (workout) {
      workout.comment = text;
      update((d) => ({
        ...d,
        workouts: (d.workouts || []).map((w) => (w.id === workout.id ? { ...w, comment: text } : w)),
      }));
    }
  };

  const close = () => {
    if (step === 0 && review) setStep(1);
    else onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top }}>
        {step === 0 ? (
          <View style={{ flex: 1 }}>
            <Confetti />
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 }}>
              <View style={{ alignItems: 'center' }}>
                <Coach mood="happy" />
                <T style={{ fontSize: 34, fontWeight: '800', marginTop: 8, letterSpacing: -0.8 }}>¡Nuevo récord!</T>
                <T mute style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
                  Lo lograste y ya quedó guardado en tu historial.
                </T>
              </View>
              <Card style={{ marginTop: 22 }}>
                {records.map((r, i) => <Mark key={`${r.exId}-${i}`} item={r} unit={unit} />)}
              </Card>
              <Btn label={review ? 'Ver resumen' : 'Cerrar'} onPress={close} style={{ marginTop: 18 }} />
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: Math.max(ins.bottom, 20) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 46, height: 46, borderRadius: 15, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={26} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <T style={{ fontSize: 24, fontWeight: '800' }}>Sesión guardada</T>
                <T mute style={{ fontSize: 13, marginTop: 2 }}>
                  {review ? `${clock(review.durationSec)} de entrenamiento` : 'Buen trabajo.'}
                </T>
              </View>
            </View>

            {workout && (
              <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="flame-outline" size={21} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <T style={{ fontWeight: '700' }}>{kcal > 0 ? `≈ ${kcal} kcal` : 'Calorías sin estimar'}</T>
                  <T mute style={{ fontSize: 12, marginTop: 1 }}>
                    {kcal > 0
                      ? 'MET × peso × tiempo (Compendium 2024).'
                      : 'Agrega tu peso corporal en tu perfil para ver las kcal.'}
                  </T>
                </View>
              </Card>
            )}

            {review && (
              <Card style={{ marginTop: 18 }}>
                {review.score === null ? (
                  <View>
                    <T style={{ fontSize: 20, fontWeight: '800', color: C.text }}>{review.grade}</T>
                    <T mute style={{ fontSize: 14, lineHeight: 20, marginTop: 8 }}>{review.supportMessage}</T>
                  </View>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                      <View>
                        <T mute style={{ fontSize: 11, letterSpacing: 1 }}>PUNTAJE DE SESIÓN</T>
                        <T style={{ fontSize: 46, fontWeight: '800', color: C.accent, lineHeight: 52 }}>{review.score}</T>
                      </View>
                      <T style={{ fontSize: 16, fontWeight: '700', color: review.score >= 75 ? C.accent : review.score >= 60 ? C.warn : C.text }}>{review.grade}</T>
                    </View>
                    {(() => {
                      const planComp = (review.components || []).find((c) => c.key === 'plan');
                      const planPct = planComp ? Math.round(planComp.value * 100) : null;
                      return planPct !== null ? (
                        <T style={{ fontSize: 14, fontWeight: '600', color: C.accent, marginTop: 8 }}>
                          Completaste el {planPct}% de tu plan.
                        </T>
                      ) : null;
                    })()}
                    <View style={{ marginTop: 10 }}>
                      {(review.components || []).map((c) => {
                        const pct = Math.round(c.value * 100);
                        const color = c.value >= 0.8 ? C.accent : c.value >= 0.5 ? C.warn : C.mute;
                        return (
                          <View key={c.key} style={{ marginTop: 10 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <T mute style={{ fontSize: 13 }}>{c.label}</T>
                              <T style={{ fontSize: 13, fontWeight: '700' }}>{pct}%</T>
                            </View>
                            <View style={{ height: 8, borderRadius: 4, backgroundColor: C.card2, marginTop: 5 }}>
                              <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: color }} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                    {!!review.adjusted && (
                      <T mute style={{ fontSize: 12, lineHeight: 17, marginTop: 12 }}>
                        Sesión ajustada a propósito ({review.adjusted.reason}): se adaptó la evaluación para no penalizar el descanso o carga.
                      </T>
                    )}
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
                    <T mute style={{ fontSize: 11, fontStyle: 'italic', lineHeight: 16, marginTop: 12 }}>
                      Este puntaje mide qué tanto seguiste tu plan, no tu salud ni tu valor. Escucha a tu cuerpo.
                    </T>
                  </>
                )}
                <Press onPress={() => setShowScore((v) => !v)} style={{ marginTop: 14, alignSelf: 'flex-start' }}>
                  <T style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>¿Cómo se calcula?</T>
                </Press>
                {showScore && (
                  <View style={{ marginTop: 8 }}>
                    <T mute style={{ fontSize: 13, lineHeight: 19 }}>{RULES.score.detail}</T>
                    <T mute style={{ fontSize: 11, lineHeight: 16, marginTop: 8 }}>Fuente: {RULES.score.source}</T>
                  </View>
                )}
              </Card>
            )}

            {!!records.length && (
              <Card style={{ marginTop: 12 }}>
                <T mute style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>RÉCORDS DE HOY</T>
                {records.map((r, i) => <Mark key={`${r.exId}-${i}`} item={r} unit={unit} />)}
              </Card>
            )}

            {!!(review && review.restNotes && review.restNotes.length) && (
              <Card style={{ marginTop: 12 }}>
                <T mute style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>DESCANSO</T>
                {review.restNotes.map((r, i) => (
                  <View key={`${r.exId}-${i}`} style={{ flexDirection: 'row', gap: 9, marginBottom: i === review.restNotes.length - 1 ? 0 : 10 }}>
                    <Ionicons name={r.kind === 'short' ? 'alert-circle-outline' : 'time-outline'} size={18} color={r.kind === 'short' ? C.warn : C.mute} />
                    <T mute style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>{r.text}</T>
                  </View>
                ))}
                <Press onPress={() => setShowRest((v) => !v)} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                  <T style={{ fontSize: 12, color: C.accent, fontWeight: '600' }}>¿Por qué importa el descanso?</T>
                </Press>
                {showRest && (
                  <T mute style={{ fontSize: 12, lineHeight: 18, marginTop: 8 }}>
                    {RULES.restFeedback.detail} Fuente: {RULES.restFeedback.source}
                  </T>
                )}
              </Card>
            )}

            <Card style={{ marginTop: 12 }}>
              <T style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>Comentario</T>
              <TextInput
                value={comment}
                onChangeText={handleCommentChange}
                multiline
                placeholder="Escribe cómo te sentiste, qué cambiarías o qué notaste…"
                placeholderTextColor={C.mute}
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

            <Btn label="Cerrar" onPress={onClose} style={{ marginTop: 18 }} />
            {!review && <T mute style={{ textAlign: 'center', fontSize: 12, marginTop: 12 }}>Los datos de esta sesión quedaron guardados.</T>}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
