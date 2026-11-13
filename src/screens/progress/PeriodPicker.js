import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../theme';
import { Card, Press, T, Btn } from '../../ui';

const OPTIONS = ['7 días', '30 días', '90 días', 'Todo', 'Personalizado'];

const fmtDate = (ms) => {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PeriodPicker({ period, setPeriod, customRange, setCustomRange, rango }) {
  const [showModal, setShowModal] = useState(false);
  const [tempDesde, setTempDesde] = useState(customRange?.desde || '');
  const [tempHasta, setTempHasta] = useState(customRange?.hasta || '');

  const [scrollX, setScrollX] = useState(0);
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);

  const maxScroll = Math.max(1, contentWidth - containerWidth);
  const thumbWidthPct = Math.max(20, (containerWidth / contentWidth) * 100);
  const maxTranslate = containerWidth * (1 - thumbWidthPct / 100);
  const translateX = maxScroll > 0 ? (scrollX / maxScroll) * maxTranslate : 0;

  useEffect(() => {
    setTempDesde(customRange?.desde || '');
    setTempHasta(customRange?.hasta || '');
  }, [customRange?.desde, customRange?.hasta]);

  const handleSelect = (opt) => {
    setPeriod(opt);
    if (opt === 'Personalizado') setShowModal(true);
  };

  const desdeLabel = period === 'Personalizado' ? (customRange?.desde || '—') : fmtDate(rango?.start);
  const hastaLabel = period === 'Personalizado' ? (customRange?.hasta || '—') : fmtDate(rango?.end);

  return (
    <Card style={{ padding: 16, marginTop: 12 }}>
      <T mute style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.12 * 13, marginBottom: 10 }}>Periodo</T>

      <ScrollView
        horizontal
        nestedScrollEnabled={true}
        directionalLockEnabled={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
        onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        scrollEventThrottle={16}
      >
        {OPTIONS.map((opt) => {
          const on = period === opt;
          return (
            <Press
              key={opt}
              onPress={() => handleSelect(opt)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 16,
                backgroundColor: on ? C.accentDim : C.card2,
                borderWidth: 1,
                borderColor: on ? C.accent : C.line,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T style={{ fontSize: 14, fontWeight: '600', color: on ? C.accent : C.muteText }}>{opt}</T>
            </Press>
          );
        })}
      </ScrollView>

      {contentWidth > containerWidth && (
        <View style={{ height: 3, backgroundColor: C.track, borderRadius: 1.5, marginTop: 10, width: '100%', overflow: 'hidden' }}>
          <View
            style={{
              height: '100%',
              backgroundColor: C.accent,
              borderRadius: 1.5,
              width: `${thumbWidthPct}%`,
              transform: [{ translateX }],
            }}
          />
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
        <Press
          onPress={() => period === 'Personalizado' && setShowModal(true)}
          style={{ flex: 1, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 10 }}
        >
          <T mute style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.08 * 11 }}>Desde</T>
          <T style={{ fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 }} numberOfLines={1}>{desdeLabel}</T>
        </Press>

        <Ionicons name="arrow-forward" size={16} color={C.muteText} />

        <Press
          onPress={() => period === 'Personalizado' && setShowModal(true)}
          style={{ flex: 1, backgroundColor: C.field, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 10 }}
        >
          <T mute style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.08 * 11 }}>Hasta</T>
          <T style={{ fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 }} numberOfLines={1}>{hastaLabel}</T>
        </Press>
      </View>

      <T mute style={{ fontSize: 12, marginTop: 10 }}>
        Aplica a la gráfica, los datos, los récords y los músculos.
      </T>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <T style={{ fontSize: 18, fontWeight: '700' }}>Seleccionar fechas</T>
              <Press onPress={() => setShowModal(false)} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={20} color={C.text} />
              </Press>
            </View>

            <T mute style={{ fontSize: 13, marginBottom: 8 }}>Formato YYYY-MM-DD (ej. 2026-10-01)</T>

            <View style={{ gap: 12, marginVertical: 10 }}>
              <View>
                <T mute style={{ fontSize: 12, marginBottom: 4 }}>Desde fecha:</T>
                <TextInput
                  value={tempDesde}
                  onChangeText={setTempDesde}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.muteText}
                  autoCapitalize="none"
                  style={{ backgroundColor: C.field, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, color: C.text, fontSize: 15 }}
                />
              </View>
              <View>
                <T mute style={{ fontSize: 12, marginBottom: 4 }}>Hasta fecha:</T>
                <TextInput
                  value={tempHasta}
                  onChangeText={setTempHasta}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={C.muteText}
                  autoCapitalize="none"
                  style={{ backgroundColor: C.field, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, color: C.text, fontSize: 15 }}
                />
              </View>
            </View>

            <Btn
              label="Aplicar rango"
              onPress={() => {
                const d = String(tempDesde || '').trim();
                const h = String(tempHasta || '').trim();
                const ymd = /^\d{4}-\d{2}-\d{2}$/;
                if (ymd.test(d) && ymd.test(h)) setCustomRange({ desde: d, hasta: h });
                setShowModal(false);
              }}
              style={{ marginTop: 16 }}
            />
          </View>
        </View>
      </Modal>
    </Card>
  );
}
