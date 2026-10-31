import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

// ✏️ Apariencia del entrenador: cambia estos valores (o pídeme otro diseño).
export const COACH = {
  name: 'Atlas',
  body: '#171C22',   // color de la cabeza
  edge: '#2C343F',   // borde
  screen: '#0E1216', // pantalla de la cara
  glow: '#7CF2C4',   // brillo y antena
  eye: '#7CF2C4',    // ojos y boca
};

const loop = (v, a, b, ms) => Animated.loop(Animated.sequence([
  Animated.timing(v, { toValue: b, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  Animated.timing(v, { toValue: a, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
]));

const MOUTH = {
  neutral: { width: 22, height: 4, borderRadius: 2, backgroundColor: COACH.eye },
  happy: { width: 26, height: 13, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderWidth: 3, borderTopWidth: 0, borderColor: COACH.eye },
  alert: { width: 26, height: 13, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderWidth: 3, borderBottomWidth: 0, borderColor: COACH.eye, marginTop: 4 },
};

export default function Coach({ mood = 'neutral' }) {
  const float = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const look = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anims = [loop(float, 0, 1, 1800), loop(glow, 0, 1, 1400), loop(look, -1, 1, 2600)];
    anims.forEach((a) => a.start());
    let t;
    const doBlink = () => {
      t = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.1, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start(doBlink);
      }, 2200 + Math.random() * 2500);
    };
    doBlink();
    return () => { anims.forEach((a) => a.stop()); clearTimeout(t); };
  }, []);

  useEffect(() => {
    pop.setValue(0.92);
    Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [mood]);

  const eye = { width: 12, height: 18, borderRadius: 6, backgroundColor: COACH.eye, transform: [{ scaleY: blink }] };
  return (
    <View style={{ width: 150, height: 170, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: COACH.glow,
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.14] }),
        transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
      }} />
      <Animated.View style={{ alignItems: 'center', transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }, { scale: pop }] }}>
        <Animated.View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COACH.glow, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }} />
        <View style={{ width: 3, height: 12, backgroundColor: COACH.edge }} />
        <View style={{ width: 108, height: 86, borderRadius: 32, backgroundColor: COACH.body, borderWidth: 2, borderColor: COACH.edge, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 86, height: 58, borderRadius: 22, backgroundColor: COACH.screen, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={{ flexDirection: 'row', gap: 20, transform: [{ translateX: look.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] }) }] }}>
              <Animated.View style={eye} /><Animated.View style={eye} />
            </Animated.View>
            <View style={[{ marginTop: 8 }, MOUTH[mood] || MOUTH.neutral]} />
          </View>
        </View>
        <View style={{ width: 70, height: 24, marginTop: 4, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: COACH.body, borderWidth: 2, borderColor: COACH.edge }} />
      </Animated.View>
    </View>
  );
}
