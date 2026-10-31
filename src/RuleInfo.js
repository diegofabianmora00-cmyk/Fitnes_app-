import React from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from './theme';
import { Btn, Card, Press, T } from './ui';

export default function RuleInfo({ visible, rules = [], onClose, title = 'Por qué Atlas dice esto' }) {
  const ins = useSafeAreaInsets();
  const list = [...new Map((rules || []).filter(Boolean).map((r) => [r.id, r])).values()];
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#00000099', justifyContent: 'flex-end' }}>
        <View style={{ maxHeight: '88%', backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 12, paddingBottom: Math.max(ins.bottom, 16) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 10 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <T style={{ fontSize: 20, fontWeight: '700' }}>{title}</T>
              <T mute style={{ fontSize: 12, marginTop: 3 }}>Cada regla con su fuente.</T>
            </View>
            <Press onPress={onClose} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="close" size={22} color={C.text} />
            </Press>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            {!list.length && <Card><T mute>Atlas no necesita una regla extra para esto.</T></Card>}
            {list.map((r) => (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <T style={{ fontSize: 16, fontWeight: '700', flex: 1 }}>{r.title}</T>
                  <View style={{ backgroundColor: r.kind === 'app' ? C.card2 : C.accentDim, borderRadius: 9, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <T style={{ fontSize: 10, letterSpacing: 0.6, color: r.kind === 'app' ? C.mute : C.accent, fontWeight: '700' }}>
                      {r.kind === 'app' ? 'CRITERIO DE LA APP' : 'CIENCIA'}
                    </T>
                  </View>
                </View>
                <T mute style={{ fontSize: 14, lineHeight: 21, marginTop: 8 }}>{r.detail}</T>
                <T mute style={{ fontSize: 11, lineHeight: 16, marginTop: 10 }}>Fuente: {r.source}</T>
              </Card>
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
            <Btn label="Entendido" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
