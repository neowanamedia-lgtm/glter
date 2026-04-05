import AsyncStorage from '@react-native-async-storage/async-storage';

export type EmotionValue = 'joy' | 'hope' | 'anxiety' | 'depression' | 'sadness' | 'none';
export type PhilosophyValue = 'eastern' | 'western';
export type ReligionValue = 'christianity' | 'buddhism' | 'islam';
export type LanguageValue = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'ar';
export type BackgroundMode = 'auto' | 'fixed';
export type FontValue = 'default' | 'soft' | 'handwriting';

export type UserSettings = {
  emotion: EmotionValue;
  philosophy: PhilosophyValue[];
  religion: ReligionValue[];
  language: LanguageValue;
  backgroundMode: BackgroundMode;
  fixedBackgroundIndex?: number;
  font: FontValue;
};

const USER_SETTINGS_KEY = 'SELOA_USER_SETTINGS';
const FIRST_LAUNCH_KEY = 'SELOA_FIRST_LAUNCH_DONE';
const BACKGROUND_CURSOR_KEY = 'SELOA_BACKGROUND_CURSOR';

export const BACKGROUND_IMAGE_COUNT = 30;

export const defaultUserSettings: UserSettings = {
  emotion: 'joy',
  philosophy: [],
  religion: [],
  language: 'ko',
  backgroundMode: 'auto',
  fixedBackgroundIndex: 0,
  font: 'default',
};

export const loadUserSettings = async (): Promise<UserSettings> => {
  try {
    const storedValue = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    if (!storedValue) {
      return { ...defaultUserSettings };
    }

    const parsed = JSON.parse(storedValue) as Partial<UserSettings>;
    return normalizeUserSettings(parsed);
  } catch (error) {
    console.warn('[userSettings] Failed to load user settings', error);
    return { ...defaultUserSettings };
  }
};

export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
  try {
    const normalized = normalizeUserSettings(settings);
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn('[userSettings] Failed to save user settings', error);
    throw error;
  }
};

export const isFirstLaunchComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
    return value === 'true';
  } catch (error) {
    console.warn('[userSettings] Failed to read first launch flag', error);
    return false;
  }
};

export const markFirstLaunchComplete = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
  } catch (error) {
    console.warn('[userSettings] Failed to set first launch flag', error);
  }
};

export const loadBackgroundCursor = async (): Promise<number> => {
  try {
    const storedValue = await AsyncStorage.getItem(BACKGROUND_CURSOR_KEY);
    if (storedValue === null || storedValue === undefined) {
      return -1;
    }

    const parsed = Number(storedValue);
    return Number.isNaN(parsed) ? -1 : parsed;
  } catch (error) {
    console.warn('[userSettings] Failed to load background cursor', error);
    return -1;
  }
};

export const saveBackgroundCursor = async (index: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(BACKGROUND_CURSOR_KEY, String(index));
  } catch (error) {
    console.warn('[userSettings] Failed to save background cursor', error);
  }
};

const normalizeUserSettings = (candidate?: Partial<UserSettings>): UserSettings => {
  const normalized: UserSettings = {
    emotion: candidate?.emotion ?? defaultUserSettings.emotion,
    philosophy: sanitizeList(candidate?.philosophy, ['eastern', 'western']),
    religion: sanitizeList(candidate?.religion, ['christianity', 'buddhism', 'islam']),
    language: candidate?.language ?? defaultUserSettings.language,
    backgroundMode: candidate?.backgroundMode ?? defaultUserSettings.backgroundMode,
    fixedBackgroundIndex: normalizeBackgroundIndex(candidate?.fixedBackgroundIndex),
    font: candidate?.font ?? defaultUserSettings.font,
  };

  return normalized;
};

const sanitizeList = <T extends string>(source: T[] | undefined, allowed: T[]): T[] => {
  if (!Array.isArray(source)) {
    return [];
  }

  return source.filter((value): value is T => allowed.includes(value));
};

const normalizeBackgroundIndex = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return defaultUserSettings.fixedBackgroundIndex ?? 0;
  }

  const safeValue = Math.max(0, Math.min(BACKGROUND_IMAGE_COUNT - 1, Math.floor(value)));
  return safeValue;
};
