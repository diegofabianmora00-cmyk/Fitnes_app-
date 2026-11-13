import React from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Text as SvgText } from 'react-native-svg';
import { C } from '../../theme';
import { Card, H, T, Btn, FadeIn } from '../../ui';
import Coach from '../../Coach';

export default function EmptyProgress({ onStartWorkout, onGoRoutines }) {
  const width = 346;
  const height = 196;
  const padLeft = 35;
  const chartW = width - padLeft - 10;
  const chartH = height - 40;

  return (
    <ScrollView
      style={{ flex: 1, width: '100%' }}
      contentContainerStyle={{ padding: 22, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <FadeIn><H>Progreso</H></FadeIn>
      <FadeIn delay={60}><T mute style={{ fontSize: 14, marginTop: 2 }}>Aún no hay datos</T></FadeIn>

      {/* Streak simplified */}
      <FadeIn delay={100}>
        <Card style={{ padding: 18, marginTop: 14 }}>
          <T mute style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.12 * 13 }}>Racha actual</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, gap: 8 }}>
            <T style={{ fontSize: 64, fontWeight: '800', color: C.dimNum, lineHeight: 70 }}>0</T>
            <T style={{ fontSize: 16, color: C.softText, fontWeight: '600' }}>días</T>
          </View>
          <T mute style={{ fontSize: 13, lineHeight: 18, marginTop: 10 }}>
            Tu racha empieza con tu primera sesión. Los días de descanso no la cortan.
          </T>
        </Card>
      </FadeIn>

      {/* Welcome Coach message */}
      <FadeIn delay={140}>
        <Card style={{ padding: 16, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.card2, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
            <Coach mood="happy" size="sm" />
          </View>
          <T style={{ flex: 1, fontSize: 14, color: C.softText, lineHeight: 20 }}>
            Hola, soy Atlas. Cuando registres tu primer entrenamiento, aquí verás tu evolución.
          </T>
        </Card>
      </FadeIn>

      {/* Tu progreso empty chart */}
      <FadeIn delay={180}>
        <Card style={{ padding: 16, marginTop: 12 }}>
          <T style={{ fontSize: 16, fontWeight: '700' }}>Tu progreso</T>
          <T mute style={{ fontSize: 13, marginTop: 2 }}>La gráfica aparece desde tu 3.ª sesión.</T>

          <View style={{ marginTop: 14, alignItems: 'center' }}>
            <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
              {[0, 0.5, 1].map((ratio, idx) => {
                const y = 15 + chartH * ratio;
                return (
                  <React.Fragment key={idx}>
                    <Line x1={padLeft} y1={y} x2={width - 10} y2={y} stroke={C.line} strokeWidth="1" />
                    <SvgText x={padLeft - 8} y={y + 4} fill={C.muteText} fontSize="10" textAnchor="end">
                      {[100, 50, 0][idx]}
                    </SvgText>
                  </React.Fragment>
                );
              })}
              <Line x1={padLeft} y1={15 + chartH} x2={width - 10} y2={15 + chartH} stroke={C.segmentOff} strokeWidth="3" strokeDasharray="6,8" />
              <SvgText x={width / 2} y={height / 2 - 10} fill={C.muteText} fontSize="13" textAnchor="middle">
                La gráfica aparece desde tu 3.ª sesión.
              </SvgText>
            </Svg>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
              {[1, 2, 3].map((num) => (
                <View key={num} style={{ width: 24, height: 6, borderRadius: 3, backgroundColor: C.segmentOff }} />
              ))}
              <T mute style={{ fontSize: 12, marginLeft: 8 }}>0 de 3 sesiones</T>
            </View>
          </View>
        </Card>
      </FadeIn>

      {/* History section */}
      <FadeIn delay={220}>
        <T style={{ fontSize: 20, fontWeight: '700', marginTop: 22, marginBottom: 10 }}>Historial</T>
        <Card style={{ padding: 16 }}>
          <T mute style={{ fontSize: 14, lineHeight: 20 }}>
            Aquí verás todas tus sesiones, con su puntaje y tus comentarios.
          </T>
        </Card>
      </FadeIn>

      <View style={{ marginTop: 24 }}>
        <Btn label="Empezar a entrenar" icon="play" onPress={onStartWorkout || onGoRoutines} />
      </View>
    </ScrollView>
  );
}
