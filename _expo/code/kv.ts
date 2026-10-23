import { hasNativeModules } from '@/lib/environment';

export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getString: (key) => map.get(key),
    set: (key, value) => {
      map.set(key, value);
    },
    delete: (key) => {
      map.delete(key);
    },
  };
}

function createNativeStore(): KeyValueStore {
  const mmkv = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const instance = mmkv.createMMKV({ id: 'app-preferences' });
  return {
    getString: (key) => instance.getString(key),
    set: (key, value) => instance.set(key, value),
    delete: (key) => {
      instance.remove(key);
    },
  };
}

export const preferences: KeyValueStore = hasNativeModules
  ? createNativeStore()
  : createMemoryStore();
