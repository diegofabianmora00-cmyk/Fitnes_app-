const { compareVersions, isUpdateAvailable, parseVersion } = require('../version');

describe('versiones de la app', () => {
  test('parsea versiones con y sin prefijo v', () => {
    expect(parseVersion('v1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('1.0')).toEqual([1, 0]);
    expect(parseVersion('')).toEqual([0]);
  });

  test('compara versiones por partes numéricas', () => {
    expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
    expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareVersions('v2.0', '1.99.99')).toBe(1);
  });

  test('solo avisa cuando la versión remota es mayor', () => {
    expect(isUpdateAvailable('1.0.0', '1.0.1')).toBe(true);
    expect(isUpdateAvailable('1.2.0', '1.2.0')).toBe(false);
    expect(isUpdateAvailable('2.0.0', '1.9.9')).toBe(false);
  });
});
