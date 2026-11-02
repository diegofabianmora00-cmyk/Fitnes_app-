import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

export const COACH = {
  name: 'Atlas',
  body: '#171C22',
  edge: '#2C343F',
  screen: '#0E1216',
  glow: '#7CF2C4',
  eye: '#7CF2C4',
};

const SIZES = {
  lg: {
    bodyW: 150, bodyH: 116, bodyR: 44, bodyBorder: 3,
    screenW: 116, screenH: 76, screenR: 30, screenGap: 9,
    eyeW: 13, eyeH: 20, eyeR: 7, eyeGap: 26,
    eyeHappyH: 9, eyeHappyBorder: 4, eyeHappyR: 10,
    mouthNeutralW: 34, mouthNeutralH: 16, mouthNeutralBorder: 4, mouthNeutralR: 18,
    mouthHappyW: 44, mouthHappyH: 22,
    alertW: 26, alertH: 4, alertBorder: 4,
    antennaW: 10, antennaH: 10, neckW: 3, neckH: 12, neckBorder: 2,
    baseW: 108, baseH: 24, baseMT: 4,
    glowSize: 150, containerW: 150, containerH: 170,
    lookRange: 3,
  },
  sm: {
    bodyW: 36, bodyH: 28, bodyR: 10, bodyBorder: 2,
    screenW: 28, screenH: 18, screenR: 7, screenGap: 3,
    eyeW: 4, eyeH: 6, eyeR: 2, eyeGap: 7,
    eyeHappyH: 3, eyeHappyBorder: 1, eyeHappyR: 3,
    mouthNeutralW: 10, mouthNeutralH: 4, mouthNeutralBorder: 1, mouthNeutralR: 4,
    mouthHappyW: 12, mouthHappyH: 6,
    alertW: 8, alertH: 2, alertBorder: 1,
    antennaW: 4, antennaH: 4, neckW: 2, neckH: 5, neckBorder: 1,
    baseW: 32, baseH: 8, baseMT: 2,
    glowSize: 42, containerW: 44, containerH: 44,
    lookRange: 1,
  },
};

const loop = (v, a, b, ms) => Animated.loop(Animated.sequence([
  Animated.timing(v, { toValue: b, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  Animated.timing(v, { toValue: a, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
]));

export default function Coach({ mood = 'neutral', size = 'lg' }) {
  const s = SIZES[size] || SIZES.lg;
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

  const happy = mood === 'happy';
  const alert = mood === 'alert';

  return (
    <View style={{ width: s.containerW, height: s.containerH, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: s.glowSize, height: s.glowSize, borderRadius: s.glowSize / 2, backgroundColor: COACH.glow,
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.14] }),
        transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
      }} />
      <Animated.View style={{ alignItems: 'center', transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [4, -6] }) }, { scale: pop }] }}>
        <Animated.View style={{ width: s.antennaW, height: s.antennaH, borderRadius: s.antennaW / 2, backgroundColor: COACH.glow, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }} />
        <View style={{ width: s.neckW, height: s.neckH, backgroundColor: COACH.edge, borderWidth: s.neckBorder, borderColor: COACH.edge }} />
        <View style={{ width: s.bodyW, height: s.bodyH, borderRadius: s.bodyR, backgroundColor: COACH.body, borderWidth: s.bodyBorder, borderColor: COACH.edge, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: s.screenW, height: s.screenH, borderRadius: s.screenR, backgroundColor: COACH.screen, alignItems: 'center', justifyContent: 'center', gap: s.screenGap }}>
            <Animated.View style={{ flexDirection: 'row', gap: s.eyeGap, transform: [{ translateX: look.interpolate({ inputRange: [-1, 1], outputRange: [-s.lookRange, s.lookRange] }) }] }}>
              {happy ? (
                <>
                  <View style={{ width: s.eyeW, height: s.eyeHappyH, borderTopLeftRadius: s.eyeHappyR, borderTopRightRadius: s.eyeHappyR, borderWidth: s.eyeHappyBorder, borderBottomWidth: 0, borderColor: COACH.eye, backgroundColor: 'transparent' }} />
                  <View style={{ width: s.eyeW, height: s.eyeHappyH, borderTopLeftRadius: s.eyeHappyR, borderTopRightRadius: s.eyeHappyR, borderWidth: s.eyeHappyBorder, borderBottomWidth: 0, borderColor: COACH.eye, backgroundColor: 'transparent' }} />
                </>
              ) : (
                <>
                  <Animated.View style={{ width: s.eyeW, height: s.eyeH, borderRadius: s.eyeR, backgroundColor: COACH.eye, transform: [{ scaleY: blink }] }} />
                  <Animated.View style={{ width: s.eyeW, height: s.eyeH, borderRadius: s.eyeR, backgroundColor: COACH.eye, transform: [{ scaleY: blink }] }} />
                </>
              )}
            </Animated.View>
            {alert ? (
              <View style={{ width: s.alertW, height: s.alertH, borderRadius: s.alertBorder / 2, backgroundColor: COACH.eye, marginTop: 4 }} />
            ) : happy ? (
              <View style={{ width: s.mouthHappyW, height: s.mouthHappyH, borderBottomLeftRadius: s.mouthHappyW / 2, borderBottomRightRadius: s.mouthHappyW / 2, borderWidth: s.mouthNeutralBorder, borderTopWidth: 0, borderColor: COACH.eye, backgroundColor: 'transparent' }} />
            ) : (
              <View style={{ width: s.mouthNeutralW, height: s.mouthNeutralH, borderBottomLeftRadius: s.mouthNeutralR, borderBottomRightRadius: s.mouthNeutralR, borderWidth: s.mouthNeutralBorder, borderTopWidth: 0, borderColor: COACH.eye, backgroundColor: 'transparent' }} />
            )}
          </View>
        </View>
        <View style={{ width: s.baseW, height: s.baseH, marginTop: s.baseMT, borderTopLeftRadius: s.baseW / 4, borderTopRightRadius: s.baseW / 4, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: COACH.body, borderWidth: s.bodyBorder, borderColor: COACH.edge }} />
      </Animated.View>
    </View>
  );
}
