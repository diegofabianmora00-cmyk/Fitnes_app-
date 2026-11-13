import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Rect, G } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);
const inOut = Easing.inOut(Easing.cubic);
const backOut = Easing.out(Easing.back(1.6));

function Bar({ color, x, base, heights, delay, play, focused, reduced }) {
  const scale = useRef(new Animated.Value(1)).current;

  const run = () => {
    if (reduced) return;
    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(scale, { toValue: heights[0] / base, duration: 220, easing: inOut, useNativeDriver: true }),
      Animated.timing(scale, { toValue: heights[1] / base, duration: 220, easing: inOut, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 280, easing: backOut, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { if (focused) run(); }, [focused]);
  useEffect(() => { if (play > 0) run(); }, [play]);

  return (
    <AnimatedG style={{ transform: [{ translateY: 20 }, { scaleY: scale }, { translateY: -20 }] }}>
      <Rect x={x} y={20 - base} width={3.5} height={base} rx={1.5} fill={color} />
    </AnimatedG>
  );
}

export default function ProgressIcon({ color = 'currentColor', size = 24, play = 0, focused = false }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let sub;
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduced).catch(() => {});
    sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduced);
    return () => { if (sub && sub.remove) sub.remove(); };
  }, []);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Bar color={color} x={4} base={8} heights={[16, 6]} delay={0} play={play} focused={focused} reduced={reduced} />
      <Bar color={color} x={10.25} base={14} heights={[6, 18]} delay={90} play={play} focused={focused} reduced={reduced} />
      <Bar color={color} x={16.5} base={11} heights={[18, 8]} delay={180} play={play} focused={focused} reduced={reduced} />
    </Svg>
  );
}
