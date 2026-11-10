import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';
import { T } from './ui';
import Coach from './Coach';

let pending = [];
let emit = null;

function show(config) {
  const cfg = { id: Date.now() + Math.random(), ...config };
  if (emit) emit(cfg);
  else pending.push(cfg);
}

export const Dialog = {
  alert: (title, message, buttons, options) => show({ title, message, buttons, options }),
};

const iconFor = (text, style) => {
  const t = String(text || '').toLowerCase();
  if (style === 'cancel') return 'close';
  if (style === 'destructive') return /eliminar|borrar/.test(t) ? 'trash-outline' : 'alert-circle-outline';
  if (/guardar|continuar|seguir|restaurar/.test(t)) return 'checkmark';
  if (/salir|descartar/.test(t)) return 'exit-outline';
  if (/reiniciar/.test(t)) return 'refresh';
  return 'chevron-forward';
};

function DialogButton({ label, style, primary, onPress }) {
  const danger = style === 'destructive';
  const cancel = style === 'cancel';
  const bg = danger ? C.danger : primary ? C.accent : C.card2;
  const fg = danger ? '#FFFFFF' : primary ? C.accentText : cancel ? C.mute : C.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 13,
        backgroundColor: bg,
        borderWidth: cancel || (!danger && !primary) ? 1 : 0,
        borderColor: C.line,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Ionicons name={iconFor(label, style)} size={18} color={fg} />
      <T style={{ flex: 1, color: fg, fontSize: 15, fontWeight: primary || danger ? '700' : '600' }}>{label}</T>
    </Pressable>
  );
}

function DialogView({ config, onDone }) {
  const { title, message, buttons, options } = config;
  const backdrop = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const iconPop = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  const list = (buttons && buttons.length ? buttons : [{ text: 'Entendido' }]);
  const ordered = [...list.filter((b) => b.style !== 'cancel'), ...list.filter((b) => b.style === 'cancel')];
  const destructive = ordered.some((b) => b.style === 'destructive');
  const defaults = ordered.filter((b) => b.style !== 'cancel' && b.style !== 'destructive');
  const numericChoices = defaults.length > 1 && defaults.every((b) => /^\d/.test(String(b.text || '').trim()));
  const primaryIndex = defaults.length && !numericChoices ? ordered.indexOf(defaults[0]) : -1;
  const cancelable = options?.cancelable !== false;
  const mood = destructive ? 'alert' : 'neutral';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 18, bounciness: 7, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, speed: 18, bounciness: 7, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(90),
        Animated.spring(iconPop, { toValue: 1, speed: 16, bounciness: 12, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const close = (action) => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(cardFade, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.96, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 10, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      onDone();
      if (action) {
        try { action(); } catch (e) {}
      }
    });
  };

  const dismiss = () => {
    if (!cancelable) return;
    const cancel = ordered.find((b) => b.style === 'cancel');
    close(cancel?.onPress);
  };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', opacity: backdrop }}>
        <Pressable style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 40 }} onPress={dismiss}>
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <Animated.View
              style={{
                opacity: cardFade,
                transform: [{ scale }, { translateY: rise }],
                backgroundColor: C.card,
                borderRadius: 28,
                borderWidth: 1,
                borderColor: C.line,
                padding: 22,
                shadowColor: '#000000',
                shadowOpacity: 0.45,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 12 },
                elevation: 16,
              }}
            >
              <View style={{ alignItems: 'center' }}>
                <Animated.View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 22,
                    backgroundColor: destructive ? `${C.danger}22` : C.accentDim,
                    borderWidth: 1,
                    borderColor: destructive ? `${C.danger}66` : `${C.accent}44`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    opacity: iconPop,
                    transform: [{ scale: iconPop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
                  }}
                >
                  <Coach mood={mood} size="sm" />
                </Animated.View>
                <T style={{ fontSize: 10, letterSpacing: 2.5, fontWeight: '700', color: destructive ? C.danger : C.accent, textTransform: 'uppercase', marginBottom: 6 }}>Atlas</T>
                <T style={{ fontSize: 21, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 }}>{title}</T>
                {message ? (
                  <T mute style={{ fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 }}>{message}</T>
                ) : null}
              </View>

              <ScrollView
                style={{ maxHeight: 320, marginTop: 20 }}
                contentContainerStyle={{ gap: 10 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {ordered.map((b, i) => (
                  <DialogButton
                    key={`${b.text}-${i}`}
                    label={b.text}
                    style={b.style}
                    primary={i === primaryIndex}
                    onPress={() => close(b.onPress)}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export function DialogHost() {
  const [current, setCurrent] = useState(null);
  const queue = useRef([]);
  const currentRef = useRef(null);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    const handler = (cfg) => {
      if (currentRef.current) {
        queue.current.push(cfg);
      } else {
        currentRef.current = cfg;
        setCurrent(cfg);
      }
    };
    emit = handler;
    if (pending.length) {
      const rest = pending;
      pending = [];
      rest.forEach(handler);
    }
    return () => { emit = null; };
  }, []);

  const advance = () => {
    const next = queue.current.length ? queue.current.shift() : null;
    currentRef.current = next;
    setCurrent(next);
  };

  if (!current) return null;

  return <DialogView key={current.id} config={current} onDone={advance} />;
}
