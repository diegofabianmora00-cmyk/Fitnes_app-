import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { getContentUriAsync } from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
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

export async function downloadAndInstallUpdate(url, onProgress, onTask) {
  const destination = new File(Paths.cache, 'FitnessCoach-update.apk');
  try {
    if (destination.exists) destination.delete();
  } catch (e) {}

  const task = File.createDownloadTask(url, destination, {
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (onProgress && totalBytes > 0) onProgress(bytesWritten / totalBytes);
    },
  });
  if (onTask) onTask(task);

  const file = await task.downloadAsync();
  if (!file) return { ok: false, canceled: true };

  try {
    await file.preview({ mimeType: 'application/vnd.android.package-archive' });
    return { ok: true };
  } catch (e) {
    try {
      const contentUri = await getContentUriAsync(file.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/vnd.android.package-archive',
        flags: 1,
      });
      return { ok: true };
    } catch (e2) {
      return { ok: false, error: e2 };
    }
  }
}
