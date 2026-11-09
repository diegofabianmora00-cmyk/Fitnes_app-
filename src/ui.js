import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';

export function Press({ onPress, onLongPress, style, children, disabled, hitSlop }) {
  const s = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(s, { toValue: v, speed: 50, bounciness: 4, useNativeDriver: true }).start();
  const flattenedStyle = Array.isArray(style) ? Object.assign({}, ...style) : (style || {});
  const layoutKeys = [
    'flex', 'flexGrow', 'flexShrink', 'flexBasis',
    'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
    'margin', 'marginHorizontal', 'marginVertical', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
    'alignSelf', 'position', 'top', 'bottom', 'left', 'right', 'zIndex'
  ];
  const layoutStyle = {};
  const innerStyle = {};
  for (const key of Object.keys(flattenedStyle)) {
    if (layoutKeys.includes(key)) {
      layoutStyle[key] = flattenedStyle[key];
    } else {
      innerStyle[key] = flattenedStyle[key];
    }
  }
  return (
    <Pressable disabled={disabled} onPress={onPress} onLongPress={onLongPress} hitSlop={hitSlop}
      style={layoutStyle}
      onPressIn={() => to(0.98)} onPressOut={() => to(1)}>
      <Animated.View style={[innerStyle, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function FadeIn({ children, delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export const Card = ({ style, children }) => (
  <View style={[{ backgroundColor: C.card, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: C.line }, style]}>{children}</View>
);
const familyFor = (w) => {
  const n = parseInt(w) || 400;
  if (n >= 700) return 'Inter_700Bold';
  if (n >= 600) return 'Inter_600SemiBold';
  if (n >= 500) return 'Inter_500Medium';
  return 'Inter_400Regular';
};
export const T = ({ style, mute, children, ...p }) => {
  const st = Array.isArray(style) ? Object.assign({}, ...style) : (style || {});
  return (
    <Text {...p} style={[{ color: mute ? C.mute : C.text, fontSize: 15, fontFamily: familyFor(st.fontWeight) }, style]}>
      {children}
    </Text>
  );
};
export const H = ({ children, style }) => (
  <Text style={[{ color: C.text, fontSize: 30, fontWeight: '700', letterSpacing: -0.6, fontFamily: 'Inter_700Bold' }, style]}>{children}</Text>
);
export const Btn = ({ label, onPress, kind, style, disabled, icon, iconRight }) => {
  const color = kind === 'ghost' ? C.text : C.accentText;
  return (
    <Press disabled={disabled} onPress={onPress} style={[{ backgroundColor: kind === 'ghost' ? C.card2 : C.accent, minHeight: 48, justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 18, borderRadius: 16, alignItems: 'center' }, disabled && { opacity: 0.45 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' }}>
        {icon ? <Ionicons name={icon} size={18} color={color} /> : null}
        <Text style={{ color, fontWeight: '700', fontSize: 16, fontFamily: 'Inter_700Bold', flexShrink: 1, textAlign: 'center' }}>{label}</Text>
        {iconRight ? <Ionicons name={iconRight} size={18} color={color} /> : null}
      </View>
    </Press>
  );
};
export const Field = ({ style, ...p }) => (
  <TextInput placeholderTextColor={C.mute} selectionColor={C.accent}
    style={[{ backgroundColor: C.card2, color: C.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, fontFamily: 'Inter_400Regular' }, style]} {...p} />
);
