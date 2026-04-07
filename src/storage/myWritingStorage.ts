import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MyWriting } from '../types/myWriting';

const STORAGE_KEY = 'GLTER_USER_MY_WRITINGS';

export const loadMyWritings = async (): Promise<MyWriting[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeMyWriting)
      .filter((writing): writing is MyWriting => writing !== null);
  } catch (error) {
    console.warn('[myWritingStorage] Failed to load', error);
    return [];
  }
};

export const saveMyWritings = async (items: MyWriting[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.warn('[myWritingStorage] Failed to save', error);
    throw error;
  }
};

const normalizeMyWriting = (value: unknown): MyWriting | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<MyWriting> & { id?: unknown };
  const id = typeof candidate.id === 'string' ? candidate.id : undefined;
  const body = typeof candidate.body === 'string' ? candidate.body : '';
  const createdAt = typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString();
  const updatedAt = typeof candidate.updatedAt === 'string' ? candidate.updatedAt : createdAt;
  const active = typeof candidate.active === 'boolean' ? candidate.active : false;

  if (!id || !body.trim()) {
    return null;
  }

  return {
    id,
    body,
    active,
    createdAt,
    updatedAt,
  };
};
