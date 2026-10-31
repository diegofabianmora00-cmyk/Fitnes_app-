import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, TextInput, View } from 'react-native';
import { C } from './theme';

export function Press({ onPress, onLongPress, style, children, disabled }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, speed: 40, bounciness: 6, useNativeDriver: true }).start();
  return (
    <Pressable disabled={disabled} onPress={onPress} onLongPress={onLongPress}
      onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function FadeIn({ children, delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export const Card = ({ style, children }) => (
  <View style={[{ backgroundColor: C.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.line }, style]}>{children}</View>
);
export const T = ({ style, mute, children, ...p }) => (
  <Text {...p} style={[{ color: mute ? C.mute : C.text, fontSize: 15 }, style]}>{children}</Text>
);
export const H = ({ children, style }) => (
  <Text style={[{ color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6 }, style]}>{children}</Text>
);
export const Btn = ({ label, onPress, kind, style }) => (
  <Press onPress={onPress} style={[{ backgroundColor: kind === 'ghost' ? C.card2 : C.accent, paddingVertical: 15, paddingHorizontal: 18, borderRadius: 16, alignItems: 'center' }, style]}>
    <Text style={{ color: kind === 'ghost' ? C.text : '#06120D', fontWeight: '700', fontSize: 16 }}>{label}</Text>
  </Press>
);
export const Field = ({ style, ...p }) => (
  <TextInput placeholderTextColor={C.mute} selectionColor={C.accent}
    style={[{ backgroundColor: C.card2, color: C.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16 }, style]} {...p} />
);
