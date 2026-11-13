import React from 'react';
import { View } from 'react-native';
import { C } from '../../theme';
import { Card, T } from '../../ui';

const fmtTime = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

export default function StatGrid({ stats }) {
  const items = [
    { label: 'Sesiones', value: stats.sessions, diff: `vs. periodo anterior: ${stats.sessionsDiff >= 0 ? '+' : ''}${stats.sessionsDiff}` },
    { label: 'Récords', value: stats.records, diff: `vs. periodo anterior: ${stats.recordsDiff >= 0 ? '+' : ''}${stats.recordsDiff}` },
    { label: 'Tiempo', value: fmtTime(stats.timeSec), diff: 'tiempo total' },
    { label: 'Constancia', value: stats.consistency, diff: `periodo anterior: ${stats.prevConsistency}` },
  ];

  return (
    <View style={{ gap: 12, marginTop: 12 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card style={{ padding: 16, height: 110, justifyContent: 'space-between' }}>
            <T mute style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.12 * 12 }}>{items[0].label}</T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.text, marginVertical: 4 }}>{items[0].value}</T>
            <T mute style={{ fontSize: 11 }} numberOfLines={1}>{items[0].diff}</T>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card style={{ padding: 16, height: 110, justifyContent: 'space-between' }}>
            <T mute style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.12 * 12 }}>{items[1].label}</T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.text, marginVertical: 4 }}>{items[1].value}</T>
            <T mute style={{ fontSize: 11 }} numberOfLines={1}>{items[1].diff}</T>
          </Card>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card style={{ padding: 16, height: 110, justifyContent: 'space-between' }}>
            <T mute style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.12 * 12 }}>{items[2].label}</T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.text, marginVertical: 4 }}>{items[2].value}</T>
            <T mute style={{ fontSize: 11 }} numberOfLines={1}>{items[2].diff}</T>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card style={{ padding: 16, height: 110, justifyContent: 'space-between' }}>
            <T mute style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.12 * 12 }}>{items[3].label}</T>
            <T style={{ fontSize: 28, fontWeight: '800', color: C.text, marginVertical: 4 }}>{items[3].value}</T>
            <T mute style={{ fontSize: 11 }} numberOfLines={1}>{items[3].diff}</T>
          </Card>
        </View>
      </View>
      <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <T mute style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.12 * 12 }}>Puntaje medio</T>
          <T style={{ fontSize: 28, fontWeight: '800', color: C.accent, marginTop: 4 }}>{stats.sessions ? stats.avgScore : '—'}</T>
        </View>
        <T mute style={{ fontSize: 12, textAlign: 'right' }}>
          {stats.sessions
            ? stats.prevSessions
              ? `${stats.diffScore >= 0 ? '+' : ''}${stats.diffScore} pts vs. periodo anterior`
              : 'sin periodo anterior para comparar'
            : 'sin sesiones en el periodo'}
        </T>
      </Card>
    </View>
  );
}
