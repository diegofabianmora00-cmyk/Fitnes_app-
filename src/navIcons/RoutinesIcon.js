import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';

const inOut = Easing.inOut(Easing.cubic);
const backOut = Easing.out(Easing.back(1.6));

export default function RoutinesIcon({ color = 'currentColor', size = 24, play = 0, focused = false }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let sub;
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduced).catch(() => {});
    sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);
  const ty = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;

  const run = () => {
    if (reduced) return;
    ty.stopAnimation();
    rot.stopAnimation();
    ty.setValue(0);
    rot.setValue(0);
    Animated.sequence([
      Animated.timing(ty, { toValue: -3, duration: 200, easing: inOut, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration: 360, easing: backOut, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(rot, { toValue: -16, duration: 180, easing: inOut, useNativeDriver: true }),
      Animated.timing(rot, { toValue: 16, duration: 260, easing: inOut, useNativeDriver: true }),
      Animated.timing(rot, { toValue: 0, duration: 320, easing: backOut, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { if (focused) run(); }, [focused]);
  useEffect(() => { if (play > 0) run(); }, [play]);

  const rotate = rot.interpolate({ inputRange: [-16, 16], outputRange: ['-16deg', '16deg'] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY: ty }, { rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <G>
          <Path d="M2 12h3 M8.5 12h7 M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Rect x={5} y={7} width={3.5} height={10} rx={1.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x={15.5} y={7} width={3.5} height={10} rx={1.2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      </Svg>
    </Animated.View>
  );
}
