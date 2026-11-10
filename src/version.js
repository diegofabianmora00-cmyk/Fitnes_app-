import appConfig from '../app.json';

export const APP_VERSION = (appConfig && appConfig.expo && appConfig.expo.version) || '1.0.0';

export function parseVersion(value) {
  return String(value || '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((part) => {
      const n = parseInt(part, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  return 0;
}

export function isUpdateAvailable(current, latest) {
  return compareVersions(latest, current) > 0;
}
