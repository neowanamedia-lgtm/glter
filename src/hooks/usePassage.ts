import { useCallback, useMemo } from 'react';

import type { EmotionKey, LanguageOption } from '../types/menu';
import type { NormalizedPassage } from '../types/NormalizedPassage';
import type { FilterSelectionState } from '../constants/filterSchema';
import { collectActiveFilterTags, normalizeFilterSelectionState } from '../constants/filterSchema';
import type { PassageRegistryEntry } from '../data/registry';
import { PASSAGE_REGISTRY } from '../data/registry';
import { adaptPassageFile } from './passageAdapter';

export type PassagePickResult = {
  id: string;
  lines: string[];
  sourceText: string;
};

type UsePassageParams = {
  language: LanguageOption;
  emotion: EmotionKey;
  filters: FilterSelectionState;
};

type LibraryCache = Partial<Record<LanguageOption, NormalizedPassage[]>>;

const LIBRARY_CACHE: LibraryCache = {};

export function usePassage({ language, emotion, filters }: UsePassageParams) {
  const safeFilters = useMemo(
    () => normalizeFilterSelectionState(filters),
    [filters],
  );

  const selectedTags = useMemo(
    () => collectActiveFilterTags(safeFilters),
    [safeFilters],
  );

  const library = useMemo(
    () => getLibraryForLanguage(language),
    [language],
  );

  const tagFiltered = useMemo(
    () => filterPassagesByTags(library, selectedTags),
    [library, selectedTags],
  );

  const emotionAndTagFiltered = useMemo(
    () => filterPassagesByEmotion(tagFiltered, emotion),
    [tagFiltered, emotion],
  );

  const emotionFiltered = useMemo(
    () => filterPassagesByEmotion(library, emotion),
    [library, emotion],
  );

  const fallbackPool = useMemo(() => {
    if (emotionAndTagFiltered.length) {
      return emotionAndTagFiltered;
    }

    if (tagFiltered.length) {
      return tagFiltered;
    }

    if (emotionFiltered.length) {
      return emotionFiltered;
    }

    return library;
  }, [emotionAndTagFiltered, tagFiltered, emotionFiltered, library]);

  const hasPassages = fallbackPool.length > 0;

  const pickNextPassage = useCallback(
    (excludeIds: string[] = []): PassagePickResult | null => {
      if (!fallbackPool.length) {
        return null;
      }

      const excludeSet = new Set(excludeIds);
      const available = fallbackPool.filter((passage) => !excludeSet.has(passage.id));
      const targetPool = available.length ? available : fallbackPool;
      const picked = pickRandomItem(targetPool);

      if (!picked) {
        return null;
      }

      return {
        id: picked.id,
        lines: picked.lines,
        sourceText: picked.sourceText,
      };
    },
    [fallbackPool],
  );

  return {
    hasPassages,
    pickNextPassage,
  };
}

function getLibraryForLanguage(language: LanguageOption): NormalizedPassage[] {
  if (LIBRARY_CACHE[language]) {
    return LIBRARY_CACHE[language] as NormalizedPassage[];
  }

  const entries = PASSAGE_REGISTRY.filter((entry) => entry.language === language);
  const library = buildPassageLibrary(entries);
  LIBRARY_CACHE[language] = library;
  return library;
}

function buildPassageLibrary(entries: PassageRegistryEntry[]): NormalizedPassage[] {
  const records: NormalizedPassage[] = [];

  entries.forEach((entry) => {
    const registryTags = [...entry.tags];
    const normalized = adaptPassageFile(entry.data, {
      category: entry.category,
      domain: entry.domain,
      language: entry.language,
    }).map((passage) => ({
      ...passage,
      tagSet: [...registryTags],
    }));

    records.push(...normalized);
  });

  return records;
}

function filterPassagesByEmotion(
  passages: NormalizedPassage[],
  emotion: EmotionKey,
): NormalizedPassage[] {
  if (emotion === 'unknown') {
    return passages;
  }

  return passages.filter((passage) => {
    const coreEmotion = normalizeLegacyEmotion(passage.emotionCore);
    const extended = Array.isArray(passage.emotionExtended)
      ? passage.emotionExtended
          .map((value) => normalizeLegacyEmotion(value))
          .filter((value): value is EmotionKey => value !== null)
      : [];

    return coreEmotion === emotion || extended.includes(emotion);
  });
}

function filterPassagesByTags(
  passages: NormalizedPassage[],
  tags: string[],
): NormalizedPassage[] {
  const activeTags = tags.filter(Boolean);

  if (!activeTags.length) {
    return passages;
  }

  const tagSet = new Set(activeTags);

  return passages.filter((passage) => {
    const passageTags = Array.isArray(passage.tagSet) ? passage.tagSet : [];
    if (!passageTags.length) {
      return false;
    }

    return passageTags.some((tag) => tagSet.has(tag));
  });
}

type LegacyEmotionKey = EmotionKey | 'depression';

function isEmotionKey(value: unknown): value is LegacyEmotionKey {
  return (
    value === 'unknown' ||
    value === 'joy' ||
    value === 'hope' ||
    value === 'anxiety' ||
    value === 'sadness' ||
    value === 'anger' ||
    value === 'depression'
  );
}

function normalizeLegacyEmotion(value: unknown): EmotionKey | null {
  if (value === 'depression') {
    return 'anger';
  }

  if (isEmotionKey(value) && value !== 'depression') {
    return value;
  }

  return null;
}

function pickRandomItem<T>(items: T[]): T | null {
  if (!items.length) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}