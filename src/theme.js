export const DARK_C = {
  bg: '#0A0C10',
  bgTop: '#10161D',
  bgBot: '#0A0C10',
  card: '#12161C',
  card2: '#161B22',
  line: '#1C222B',
  text: '#EEF2F5',
  mute: '#9AA4B4',
  accent: '#7DF2C4',
  accentText: '#06140E',
  accentDim: '#173A2F',
  warn: '#FFB86B',
  danger: '#FF6B6B',
  ghost: '#161B22',
  stepBtn: '#161B22',
  segmentOff: '#242B35',
  track: '#242B35',
  ringTrack: '#1B222A',
  body: '#171C22',
  edge: '#1C222B',
  screen: '#0A0C10',
  field: '#0D1117',
  restText: '#8B95A5',
  gradRing0: '#4FE0B0',
  gradRing1: '#B9FFE6',
  gradPlay0: '#A8FADC',
  gradPlay1: '#4FE0B0',
  playTriangle: '#06241A',
  softText: '#C5CCD6',
  muteText: '#8B95A5',
  borderDashed: '#2A323D',
  dimNum: '#4A5361',
  amber: '#F2C46D',
  amberDim: '#2A2312',
};

export const LIGHT_C = {
  bg: '#F0F4F8',
  bgTop: '#FFFFFF',
  bgBot: '#F0F4F8',
  card: '#FFFFFF',
  card2: '#E6EEF4',
  line: '#D2DFEC',
  text: '#111827',
  mute: '#64748B',
  accent: '#059669',
  accentText: '#FFFFFF',
  accentDim: '#D1FAE5',
  warn: '#D97706',
  danger: '#DC2626',
  ghost: '#E6EEF4',
  stepBtn: '#E6EEF4',
  segmentOff: '#E2E8F0',
  track: '#E2E8F0',
  ringTrack: '#CBD5E1',
  body: '#FFFFFF',
  edge: '#D2DFEC',
  screen: '#F0F4F8',
  field: '#FFFFFF',
  restText: '#475569',
  gradRing0: '#059669',
  gradRing1: '#34D399',
  gradPlay0: '#34D399',
  gradPlay1: '#059669',
  playTriangle: '#FFFFFF',
  softText: '#334155',
  muteText: '#64748B',
  borderDashed: '#CBD5E1',
  dimNum: '#94A3B8',
  amber: '#D97706',
  amberDim: '#FEF3C7',
};

export const DARK_COACH = {
  name: 'Atlas',
  body: '#171C22',
  edge: '#2C343F',
  screen: '#0E1216',
  glow: '#7CF2C4',
  eye: '#7CF2C4',
};

export const LIGHT_COACH = {
  name: 'Atlas',
  body: '#FFFFFF',
  edge: '#CBD5E1',
  screen: '#F1F5F9',
  glow: '#059669',
  eye: '#059669',
};

export const C = { ...DARK_C };
export const COACH = { ...DARK_COACH };

export function setThemeMode(mode) {
  const isLight = mode === 'light';
  const targetC = isLight ? LIGHT_C : DARK_C;
  for (const key of Object.keys(targetC)) {
    C[key] = targetC[key];
  }
  const targetCoach = isLight ? LIGHT_COACH : DARK_COACH;
  for (const key of Object.keys(targetCoach)) {
    COACH[key] = targetCoach[key];
  }
}
