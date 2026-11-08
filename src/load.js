// Sistema de tipos de carga y cálculos de peso (lógica pura).

export const GYM_DEFAULT = {
  unit: 'kg',
  bars: [
    { id: 'olimpica', name: 'Barra olímpica (20 kg)', weightKg: 20 },
    { id: 'estandar', name: 'Barra estándar (15 kg)', weightKg: 15 },
    { id: 'ez', name: 'Barra EZ (10 kg)', weightKg: 10 },
    { id: 'corta', name: 'Barra corta (10 kg)', weightKg: 10 },
  ],
  defaultBarId: 'olimpica',
  platesKg: [25, 20, 15, 10, 5, 2.5, 1.25],
  platesLb: [45, 35, 25, 10, 5, 2.5],
  dumbbellStep: 1,
  stackStep: 5,
  carriageKg: 40,
  countCarriage: false,
};

export const defaultLoadType = (equipment, id) => {
  if (['prensa', 'hack-squat', 'hip-thrust-maquina'].includes(id)) return 'plates';
  if (equipment === 'Barra' || equipment === 'Barra Z') return 'barbell';
  if (equipment === 'Mancuernas') return 'dumbbell';
  if (equipment === 'Peso corporal') return 'bodyweight';
  if (equipment === 'Máquina' || equipment === 'Polea') return 'stack';
  return 'plain';
};

export function totalFromInputs(loadType, inputs, gym = GYM_DEFAULT) {
  if (inputs == null) return 0;
  if (typeof inputs === 'number') return Number(inputs) || 0;
  if (typeof inputs === 'object') {
    if (inputs.weightKg !== undefined) return Number(inputs.weightKg) || 0;
    if (inputs.w !== undefined) return Number(inputs.w) || 0;
    if (loadType === 'barbell' || loadType === 'plates') {
      const barKg = Number(
        inputs.barKg ??
        inputs.baseKg ??
        (loadType === 'barbell'
          ? (gym.bars?.find((b) => b.id === gym.defaultBarId)?.weightKg ?? 20)
          : (gym.countCarriage ? (gym.carriageKg || 0) : 0))
      ) || 0;
      const platesArr = inputs.platesPerSide || inputs.plates || [];
      const sumOneSide = platesArr.reduce((a, b) => a + (Number(b) || 0), 0);
      const total = barKg + 2 * sumOneSide;
      return Math.round(total * 100) / 100;
    }
    if (inputs.value !== undefined) return Number(inputs.value) || 0;
  }
  return Number(inputs) || 0;
}

export function plateBreakdown(totalKg, barKg = 20, plates = [25, 20, 15, 10, 5, 2.5, 1.25]) {
  const total = Number(totalKg) || 0;
  const bar = Number(barKg) || 0;
  const net = Math.max(0, total - bar);
  const targetPerSide = net / 2;
  let rem = targetPerSide;
  const sortedPlates = [...plates].sort((a, b) => b - a);
  const breakdown = [];
  let actualPerSide = 0;

  for (const p of sortedPlates) {
    while (rem >= p - 1e-5) {
      breakdown.push(p);
      actualPerSide += p;
      rem -= p;
    }
  }

  if (sortedPlates.length > 0 && rem > 0) {
    const smallest = sortedPlates[sortedPlates.length - 1];
    if (rem >= smallest / 2) {
      breakdown.push(smallest);
      actualPerSide += smallest;
      rem -= smallest;
    }
  }

  const actualTotal = bar + 2 * actualPerSide;
  return {
    platesPerSide: breakdown,
    perSide: Math.round(actualPerSide * 100) / 100,
    actualTotal: Math.round(actualTotal * 100) / 100,
  };
}

export function nearestLoadable(loadType, targetKg, gym = GYM_DEFAULT) {
  const target = Number(targetKg) || 0;
  const unit = gym.unit || 'kg';
  const plates = unit === 'lb' ? (gym.platesLb || [45, 35, 25, 10, 5, 2.5]) : (gym.platesKg || [25, 20, 15, 10, 5, 2.5, 1.25]);

  if (loadType === 'barbell') {
    const barKg = gym.bars?.find((b) => b.id === gym.defaultBarId)?.weightKg ?? 20;
    return plateBreakdown(target, barKg, plates).actualTotal;
  }
  if (loadType === 'plates') {
    const carriage = gym.countCarriage ? (gym.carriageKg || 0) : 0;
    return plateBreakdown(target, carriage, plates).actualTotal;
  }
  if (loadType === 'dumbbell') {
    const step = Number(gym.dumbbellStep) || (unit === 'lb' ? 5 : 1);
    return Math.round(target / step) * step;
  }
  if (loadType === 'stack') {
    const step = Number(gym.stackStep) || (unit === 'lb' ? 10 : 5);
    return Math.round(target / step) * step;
  }
  const step = unit === 'lb' ? 2.5 : 1;
  return Math.round(target / step) * step;
}

export const loadTypeLabels = {
  barbell: 'Barra con discos',
  plates: 'Máquina de discos',
  dumbbell: 'Mancuernas',
  stack: 'Máquina / Polea (Stack)',
  bodyweight: 'Peso corporal / Lastre',
  plain: 'Peso libre',
};

export function volumeFactor(exercise) {
  if (!exercise) return 1;
  const loadType = exercise.loadType || (exercise.equipment === 'Mancuernas' ? 'dumbbell' : 'plain');
  if (loadType !== 'dumbbell') return 1;
  const id = exercise.id || '';
  const name = (exercise.name || '').toLowerCase();
  const unilateralIds = ['remo-mancuerna', 'zancadas', 'sentadilla-bulgara', 'sentadilla-copa', 'curl-concentrado', 'curl-banco-scott-mancuerna', 'patada-triceps', 'giros-rusos'];
  if (unilateralIds.includes(id)) return 1;
  if (
    name.includes('una mano') ||
    name.includes('alternado') ||
    name.includes('búlgara') ||
    name.includes('zancada') ||
    name.includes('concentrado') ||
    name.includes('patada') ||
    name.includes('copa') ||
    name.includes('goblet')
  ) {
    return 1;
  }
  return 2;
}
