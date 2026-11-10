import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';
import { Btn, Card, FadeIn, Field, H, Press, T } from '../ui';
import { fromU, toU, useStore } from '../store';
import {
  AMBITIONS, GOALS, LEVELS, REST_STYLES, SEXES,
  ENVIRONMENTS, ACTIVITY_LEVELS, JOINT_FOCUSES,
  frequencyAdvice, labelOf, repRangeFor, restFor,
} from '../recommend';
import { COACH_TONES } from '../coachMemory';

const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const TOTAL = 10;

function Option({ selected, onPress, icon, title, desc }) {
  return (
    <Press
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: selected ? C.accentDim : C.card,
        borderWidth: 1, borderColor: selected ? C.accent : C.line, borderRadius: 18,
        padding: 16, marginTop: 10,
      }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: selected ? C.accent : C.card2, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={icon} size={22} color={selected ? C.accentText : C.mute} />
      </View>
      <View style={{ flex: 1 }}>
        <T style={{ fontSize: 16, fontWeight: '700' }}>{title}</T>
        {!!desc && <T mute style={{ fontSize: 13, marginTop: 3, lineHeight: 18 }}>{desc}</T>}
      </View>
      {selected && <Ionicons name="checkmark-circle" size={22} color={C.accent} />}
    </Press>
  );
}

function Chips({ options, value, onChange, render }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Press
            key={String(o)}
            onPress={() => onChange(o)}
            style={{
              paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14,
              backgroundColor: on ? C.accentDim : C.card2,
              borderWidth: 1, borderColor: on ? C.accent : C.line,
            }}
          >
            <T style={{ fontWeight: '600', color: on ? C.accent : C.text }}>{render ? render(o) : o}</T>
          </Press>
        );
      })}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: C.line }}>
      <T mute style={{ fontSize: 14 }}>{label}</T>
      <T style={{ fontSize: 14, fontWeight: '600', textAlign: 'right', flexShrink: 1 }}>{value}</T>
    </View>
  );
}

export default function ProfileSetup({ mode = 'setup', onDone }) {
  const { data, update } = useStore();
  const ins = useSafeAreaInsets();
  const unit = data.unit;
  const closable = mode === 'edit';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    const p = data.profile || {};
    return {
      goal: p.goal || 'hipertrofia',
      environment: p.environment || 'gimnasio',
      ambition: p.ambition || 'progresar',
      level: p.level || 'principiante',
      daysPerWeek: p.daysPerWeek || 3,
      weight: p.weightKg ? String(toU(p.weightKg, unit)) : '',
      height: p.heightCm ? String(p.heightCm) : '',
      age: p.age ? String(p.age) : '',
      sex: p.sex || 'hombre',
      activityLevel: p.activityLevel || 'moderado',
      jointFocus: p.jointFocus || 'ninguna',
      restStyle: p.restStyle || 'equilibrado',
      tone: p.tone || 'tranquilo',
    };
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const weightKg = fromU(parseFloat(form.weight), unit);
  const weightOk = Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 300;
  const heightOk = Number(form.height) >= 120 && Number(form.height) <= 230;
  const ageOk = Number(form.age) >= 13 && Number(form.age) <= 100;
  const bodyOk = weightOk && heightOk && ageOk;
  const bodyTouched = form.weight !== '' || form.height !== '' || form.age !== '';
  const bodyError = !weightOk
    ? `Peso entre ${unit === 'kg' ? '30 y 300 kg' : '66 y 661 lb'}.`
    : !heightOk
      ? 'Estatura entre 120 y 230 cm.'
      : !ageOk
        ? 'Edad entre 13 y 100 años.'
        : '';

  const profileLike = {
    goal: form.goal, level: form.level, restStyle: form.restStyle, daysPerWeek: form.daysPerWeek,
  };
  const range = repRangeFor(profileLike);
  const restC = restFor(profileLike, 'compuesto');
  const restI = restFor(profileLike, 'aislamiento');
  const freq = frequencyAdvice(profileLike);
  const canNext = step !== 5 || bodyOk;

  const save = () => {
    if (!bodyOk) { setStep(5); return; }
    update((d) => ({
      ...d,
      profile: {
        ...(d.profile || {}),
        goal: form.goal,
        environment: form.environment,
        ambition: form.ambition,
        level: form.level,
        daysPerWeek: Number(form.daysPerWeek),
        weightKg,
        heightCm: Number(form.height),
        age: Number(form.age),
        sex: form.sex,
        activityLevel: form.activityLevel,
        jointFocus: form.jointFocus,
        restStyle: form.restStyle,
        tone: form.tone,
        completed: true,
        updatedAt: Date.now(),
      },
    }));
    if (onDone) onDone();
  };

  const title = [
    '¿Cuál es tu objetivo?',
    '¿Dónde entrenas?',
    '¿Cuánto quieres progresar?',
    'Tu experiencia con pesas',
    '¿Cuántos días por semana?',
    'Tus datos corporales',
    'Nivel de actividad diaria',
    'Cuidado articular y enfoque',
    'Estilo de descanso entre series',
    'Tono de Atlas y Resumen',
  ][step];

  const subtitle = [
    'Atlas ajustará el peso, las repeticiones y el descanso según lo que buscas.',
    'Personaliza las sugerencias de ejercicios según tu gimnasio o casa.',
    'Define cuándo Atlas debe subirte el peso de trabajo.',
    'Así sabemos con qué cargas empezar y cuánto exigirte desde el día uno.',
    'La constancia y frecuencia óptima según la ciencia del ACSM.',
    'Se usan para calcular tus recomendaciones.',
    'Ayuda a Atlas a calibrar tu recuperación y gasto energético.',
    'Adapta las alertas de seguridad y prevención de lesiones.',
    'Tu preferencia ajusta el descanso sin salir de los rangos seguros.',
    'Elige cómo te habla Atlas y revisa la configuración completa que aplicará.',
  ][step];

  return (
    <Modal visible animationType="slide" onRequestClose={closable ? onDone : () => {}}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.bg, paddingTop: ins.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 }}>
          {closable ? (
            <Press onPress={onDone} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={22} color={C.text} />
            </Press>
          ) : <View style={{ width: 40 }} />}
          <T mute style={{ fontSize: 12, letterSpacing: 1 }}>{mode === 'edit' ? 'MI PERFIL' : 'CONFIGURA TU PERFIL'}</T>
          <T mute style={{ fontSize: 12, width: 40, textAlign: 'right' }}>{step + 1}/{TOTAL}</T>
        </View>

        <View style={{ height: 4, backgroundColor: C.card2, borderRadius: 2, marginHorizontal: 18 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: C.accent, width: `${((step + 1) / TOTAL) * 100}%` }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 130 }} keyboardShouldPersistTaps="handled">
          <FadeIn key={step}>
            <T mute style={{ fontSize: 11, letterSpacing: 1 }}>PASO {step + 1} DE {TOTAL}</T>
            <H style={{ fontSize: 28, marginTop: 6, lineHeight: 34 }}>{title}</H>
            <T mute style={{ marginTop: 8, lineHeight: 22 }}>{subtitle}</T>

            {step === 0 && (
              <View>
                {GOALS.map((g) => (
                  <Option key={g.id} selected={form.goal === g.id} onPress={() => set('goal', g.id)} icon={g.icon} title={g.label} desc={g.desc} />
                ))}
              </View>
            )}

            {step === 1 && (
              <View>
                {ENVIRONMENTS.map((e) => (
                  <Option key={e.id} selected={form.environment === e.id} onPress={() => set('environment', e.id)} icon={e.icon} title={e.label} desc={e.desc} />
                ))}
              </View>
            )}

            {step === 2 && (
              <View>
                {AMBITIONS.map((a) => (
                  <Option key={a.id} selected={form.ambition === a.id} onPress={() => set('ambition', a.id)} icon={a.icon} title={a.label} desc={a.desc} />
                ))}
              </View>
            )}

            {step === 3 && (
              <View>
                {LEVELS.map((l) => (
                  <Option key={l.id} selected={form.level === l.id} onPress={() => set('level', l.id)} icon={l.icon} title={l.label} desc={l.desc} />
                ))}
              </View>
            )}

            {step === 4 && (
              <View>
                <Chips options={[2, 3, 4, 5, 6]} value={form.daysPerWeek} onChange={(v) => set('daysPerWeek', v)} render={(v) => `${v} días`} />
                <Card style={{ marginTop: 18 }}>
                  <T mute style={{ fontSize: 13, lineHeight: 19 }}>
                    Para tu nivel, el ACSM recomienda {freq.min}-{freq.max} días por semana.
                  </T>
                  <T style={{ fontSize: 13, lineHeight: 19, marginTop: 6, color: freq.ok ? C.accent : C.warn }}>
                    {freq.ok ? 'Tu elección está dentro del rango recomendado.' : `Tu elección queda fuera del rango (${freq.min}-${freq.max}); podrás ajustarla.`}
                  </T>
                </Card>
              </View>
            )}

            {step === 5 && (
              <View>
                <Card style={{ marginTop: 16 }}>
                  <T mute style={{ fontSize: 11, letterSpacing: 1 }}>PESO CORPORAL ({unit.toUpperCase()})</T>
                  <Field
                    value={form.weight}
                    onChangeText={(v) => set('weight', v)}
                    keyboardType="decimal-pad"
                    placeholder={unit === 'kg' ? '75' : '165'}
                    style={{ marginTop: 6 }}
                  />
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <View style={{ flex: 1 }}>
                      <T mute style={{ fontSize: 11, letterSpacing: 1 }}>ESTATURA (CM)</T>
                      <Field value={form.height} onChangeText={(v) => set('height', v)} keyboardType="number-pad" placeholder="175" style={{ marginTop: 6 }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <T mute style={{ fontSize: 11, letterSpacing: 1 }}>EDAD</T>
                      <Field value={form.age} onChangeText={(v) => set('age', v)} keyboardType="number-pad" placeholder="30" style={{ marginTop: 6 }} />
                    </View>
                  </View>
                </Card>
                <T mute style={{ fontSize: 13, marginTop: 18, marginBottom: 4 }}>Sexo biológico</T>
                <Chips options={SEXES.map((s) => s.id)} value={form.sex} onChange={(v) => set('sex', v)} render={(id) => labelOf(SEXES, id)} />
                {!!(bodyError && bodyTouched) && <T style={{ color: C.warn, fontSize: 13, marginTop: 12 }}>{bodyError}</T>}
              </View>
            )}

            {step === 6 && (
              <View>
                {ACTIVITY_LEVELS.map((al) => (
                  <Option key={al.id} selected={form.activityLevel === al.id} onPress={() => set('activityLevel', al.id)} icon={al.icon} title={al.label} desc={al.desc} />
                ))}
              </View>
            )}

            {step === 7 && (
              <View>
                {JOINT_FOCUSES.map((jf) => (
                  <Option key={jf.id} selected={form.jointFocus === jf.id} onPress={() => set('jointFocus', jf.id)} icon={jf.icon} title={jf.label} desc={jf.desc} />
                ))}
              </View>
            )}

            {step === 8 && (
              <View>
                {REST_STYLES.map((r) => {
                  const c = restFor({ ...profileLike, restStyle: r.id }, 'compuesto');
                  const i = restFor({ ...profileLike, restStyle: r.id }, 'aislamiento');
                  return (
                    <Option
                      key={r.id}
                      selected={form.restStyle === r.id}
                      onPress={() => set('restStyle', r.id)}
                      icon={r.icon}
                      title={r.label}
                      desc={`${r.desc} Compuesto ${mm(c)} · aislamiento ${mm(i)}.`}
                    />
                  );
                })}
              </View>
            )}

            {step === 9 && (
              <View>
                <T mute style={{ fontSize: 13, marginBottom: 10 }}>Elige el tono de voz de Atlas</T>
                {COACH_TONES.map((t) => (
                  <Option
                    key={t.id}
                    selected={form.tone === t.id}
                    onPress={() => set('tone', t.id)}
                    icon="chatbubble-outline"
                    title={t.label}
                    desc={t.desc}
                  />
                ))}
                <Card style={{ marginTop: 22 }}>
                  <T mute style={{ fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>CONFIGURACIÓN APLICADA POR ATLAS</T>
                  <Row label="Objetivo" value={labelOf(GOALS, form.goal)} />
                  <Row label="Entorno" value={labelOf(ENVIRONMENTS, form.environment)} />
                  <Row label="Progresión" value={labelOf(AMBITIONS, form.ambition)} />
                  <Row label="Nivel" value={labelOf(LEVELS, form.level)} />
                  <Row label="Días / semana" value={`${form.daysPerWeek} días`} />
                  <Row label="Peso corporal" value={`${form.weight} ${unit}`} />
                  <Row label="Estatura / Edad" value={`${form.height} cm · ${form.age} años`} />
                  <Row label="Actividad" value={labelOf(ACTIVITY_LEVELS, form.activityLevel)} />
                  <Row label="Enfoque articular" value={labelOf(JOINT_FOCUSES, form.jointFocus)} />
                  <Row label="Descanso" value={labelOf(REST_STYLES, form.restStyle)} />
                  <Row label="Tono de Atlas" value={labelOf(COACH_TONES, form.tone) || form.tone} />
                </Card>
                <Card style={{ marginTop: 12 }}>
                  <T mute style={{ fontSize: 12, letterSpacing: 1, marginBottom: 4 }}>PARÁMETROS DEL MOTOR</T>
                  <Row label="Rango de repeticiones" value={`${range.min}-${range.max} por serie`} />
                  <Row label="Descanso compuesto" value={mm(restC)} />
                  <Row label="Descanso aislamiento" value={mm(restI)} />
                  <T mute style={{ fontSize: 11, marginTop: 12, lineHeight: 16 }}>
                    Fuentes: ACSM 2009 · Grgic 2017 · Zourdos 2016. Esta app no sustituye a un profesional de la salud.
                  </T>
                </Card>
              </View>
            )}
          </FadeIn>
        </ScrollView>

        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: Math.max(ins.bottom, 18),
          flexDirection: 'row', gap: 10, backgroundColor: C.bg, borderTopWidth: 1, borderColor: C.line,
        }}>
          {step > 0 && <Btn kind="ghost" label="Atrás" onPress={() => setStep((s) => s - 1)} style={{ flex: 1 }} />}
          <Btn
            label={step === TOTAL - 1 ? (mode === 'edit' ? 'Guardar' : 'Empezar') : 'Continuar'}
            disabled={!canNext}
            onPress={() => (step === TOTAL - 1 ? save() : setStep((s) => s + 1))}
            style={{ flex: 2 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
