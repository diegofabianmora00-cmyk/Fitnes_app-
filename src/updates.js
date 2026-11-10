import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { KEYS } from './store';

export const UPDATE_MANIFEST_URL = 'https://raw.githubusercontent.com/diegofabianmora00-cmyk/Fitnes_app-/main/update.json';

export async function fetchLatestUpdate(timeoutMs = 8000) {
  const url = `${UPDATE_MANIFEST_URL}?t=${Date.now()}`;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      signal: controller ? controller.signal : undefined,
    });
    if (timer) clearTimeout(timer);
    if (!res || !res.ok) return null;
    const json = await res.json();
    if (!json || !json.version || !json.downloadUrl) return null;
    return {
      version: String(json.version),
      downloadUrl: String(json.downloadUrl),
      notes: json.notes ? String(json.notes) : '',
    };
  } catch (e) {
    if (timer) clearTimeout(timer);
    return null;
  }
}

export async function getSeenUpdate() {
  try {
    return await AsyncStorage.getItem(KEYS.update);
  } catch (e) {
    return null;
  }
}

export async function setSeenUpdate(version) {
  try {
    await AsyncStorage.setItem(KEYS.update, String(version));
  } catch (e) {}
}

export async function openUpdate(url) {
  try {
    await Linking.openURL(url);
    return true;
  } catch (e) {
    return false;
  }
}
