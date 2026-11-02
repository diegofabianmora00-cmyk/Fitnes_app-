import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme';
import { Card, Press, T, FadeIn } from '../../ui';
import Coach, { COACH } from '../../Coach';

export default function AtlasMessage({ msg, onWhy }) {
  return (
    <>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Coach mood={msg.mood} size="lg" />
      </View>
      <FadeIn key={msg.text} delay={150}>
        <Card style={{ marginTop: 4, padding: 16 }}>
          <T mute style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginBottom: 8, textTransform: 'uppercase' }}>
            {COACH.name}
          </T>
          <T style={{ fontSize: 17, fontWeight: '600', lineHeight: 23, color: C.text }}>{msg.text}</T>
          {!!(msg.rules && msg.rules.length) && (
            <>
              <View style={{ height: 1, backgroundColor: C.line, marginTop: 10, marginBottom: 4 }} />
              <Press
                onPress={onWhy}
                hitSlop={12}
                style={{ marginTop: 6, alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                accessibilityLabel="¿Por qué lo dice Atlas?"
              >
                <Ionicons name="information-circle-outline" size={16} color={C.accent} />
                <T style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>¿Por qué lo dice Atlas?</T>
              </Press>
            </>
          )}
        </Card>
      </FadeIn>
    </>
  );
}
