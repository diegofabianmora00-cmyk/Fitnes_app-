import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const inOut = Easing.inOut(Easing.cubic);
const backOut = Easing.out(Easing.back(1.6));

export default function HomeIcon({ color = 'currentColor', size = 24, play = 0, focused = false }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let sub;
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduced).catch(() => {});
    sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);
  const roofY = useRef(new Animated.Value(0)).current;
  const doorScale = useRef(new Animated.Value(1)).current;

  const run = () => {
    if (reduced) return;
    roofY.stopAnimation();
    doorScale.stopAnimation();
    roofY.setValue(0);
    doorScale.setValue(1);
    Animated.sequence([
      Animated.timing(roofY, { toValue: -3.5, duration: 200, easing: inOut, useNativeDriver: true }),
      Animated.timing(roofY, { toValue: 0, duration: 380, easing: backOut, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(70),
      Animated.timing(doorScale, { toValue: 0.25, duration: 200, easing: inOut, useNativeDriver: true }),
      Animated.timing(doorScale, { toValue: 1, duration: 380, easing: backOut, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { if (focused) run(); }, [focused]);
  useEffect(() => { if (play > 0) run(); }, [play]);

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <AnimatedG style={{ transform: [{ translateY: roofY }] }}>
        <Path d="M3 12l9-9 9 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </AnimatedG>
      <AnimatedG style={{ transform: [{ translateY: 21 }, { scaleY: doorScale }, { translateY: -21 }] }}>
        <Path d="M10 21v-5a2 2 0 0 1 4 0v5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </AnimatedG>
    </Svg>
  );
}
