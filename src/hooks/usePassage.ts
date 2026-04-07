import { useCallback, useMemo } from 'react';

import type { EmotionKey, LanguageOption } from '../types/menu';
import type { NormalizedPassage } from '../types/NormalizedPassage';
import type { FilterSelectionState } from '../constants/filterSchema';
import { collectActiveFilterTags, normalizeFilterSelectionState } from '../constants/filterSchema';
import type { PassageRegistryEntry } from '../data/registry';
import { PASSAGE_REGISTRY } from '../data/registry';
import { adaptPassageFile } from './passageAdapter';
import type { MyWriting } from '../types/myWriting';

export type PassagePickResult = {
  id: string;
  lines: string[];
  sourceText: string;
};

type UsePassageParams = {
  language: LanguageOption;
  emotion: EmotionKey;
  filters: FilterSelectionState;
  includeMyWriting?: boolean;
  myWritings?: MyWriting[];
};

type LibraryCache = Partial<Record<LanguageOption, NormalizedPassage[]>>;

type PassageMeta = {
  tradition?: unknown;
  category?: unknown;
  author?: unknown;
  book?: unknown;
  bookDisplay?: unknown;
};

type PassageWithMeta = NormalizedPassage & {
  meta?: PassageMeta;
  sourceText: string;
  tagSet?: string[];
};

const LIBRARY_CACHE: LibraryCache = {};

export function usePassage({
  language,
  emotion,
  filters,
  includeMyWriting = false,
  myWritings = [],
}: UsePassageParams) {
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

  const activeMyWritingLibrary = useMemo(
    () => buildMyWritingLibrary(myWritings),
    [myWritings],
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

  const myWritingEmotionFiltered = useMemo(
    () => filterPassagesByEmotion(activeMyWritingLibrary, emotion),
    [activeMyWritingLibrary, emotion],
  );

  const fallbackPool = useMemo(() => {
    const hasActiveTags = selectedTags.length > 0;
    const hasMyWriting = includeMyWriting && activeMyWritingLibrary.length > 0;

    if (hasActiveTags) {
      if (hasMyWriting) {
        if (emotionAndTagFiltered.length || myWritingEmotionFiltered.length) {
          return [...emotionAndTagFiltered, ...myWritingEmotionFiltered];
        }

        if (tagFiltered.length || activeMyWritingLibrary.length) {
          return [...tagFiltered, ...activeMyWritingLibrary];
        }

        return [];
      }

      if (emotionAndTagFiltered.length) {
        return emotionAndTagFiltered;
      }

      if (tagFiltered.length) {
        return tagFiltered;
      }

      return [];
    }

    if (hasMyWriting) {
      if (myWritingEmotionFiltered.length || emotionFiltered.length) {
        return [...emotionFiltered, ...myWritingEmotionFiltered];
      }

      return [...library, ...activeMyWritingLibrary];
    }

    if (emotionFiltered.length) {
      return emotionFiltered;
    }

    return library;
  }, [
    selectedTags,
    includeMyWriting,
    activeMyWritingLibrary,
    emotionAndTagFiltered,
    myWritingEmotionFiltered,
    tagFiltered,
    emotionFiltered,
    library,
  ]);

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
    const registryTags = Array.isArray(entry.tags) ? [...entry.tags] : [];
    const normalized = adaptPassageFile(entry.data, {
      category: entry.category,
      domain: entry.domain,
      language: entry.language,
    }).map((passage) => {
      const taggedPassage = {
        ...passage,
        tagSet: [...registryTags],
      } as PassageWithMeta;

      return applyNovelSourceText(taggedPassage, registryTags);
    });

    records.push(...normalized);
  });

  return records;
}

function buildMyWritingLibrary(myWritings: MyWriting[]): NormalizedPassage[] {
  return myWritings
    .filter((writing) => writing.active && typeof writing.body === 'string' && writing.body.trim().length > 0)
    .map((writing) => {
      const lines = normalizeMyWritingBodyToLines(writing.body);

      return {
        id: writing.id,
        lines,
        sourceText: '나의 글',
        emotionCore: 'unknown',
        emotionExtended: [],
        tagSet: ['my_writing'],
      } as NormalizedPassage;
    })
    .filter((passage) => passage.lines.length > 0);
}

function normalizeMyWritingBodyToLines(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function applyNovelSourceText(
  passage: PassageWithMeta,
  registryTags: string[],
): NormalizedPassage {
  if (!shouldUseNovelSourceText(passage, registryTags)) {
    return passage;
  }

  const sourceText = buildNovelSourceText(passage.meta);

  if (!sourceText) {
    return passage;
  }

  return {
    ...passage,
    sourceText,
  };
}

function shouldUseNovelSourceText(
  passage: PassageWithMeta,
  registryTags: string[],

): boolean {
  const tradition = toCleanString(passage.meta?.tradition);
  const category = toCleanString(passage.meta?.category);

  if (tradition === 'literature' && category === 'novel') {
    return true;
  }

  return registryTags.some((tag) => tag === 'eastern_novel' || tag === 'western_novel');
}

function buildNovelSourceText(meta?: PassageMeta): string | null {
  const author = toCleanString(meta?.author);
  const bookDisplay = toCleanString(meta?.bookDisplay);
  const book = toCleanString(meta?.book);
  const title = bookDisplay || book;

  if (!author || !title) {
    return null;
  }

  return `${author} (${title})`;
}

function toCleanString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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
    const passageTags = Array.isArray((passage as PassageWithMeta).tagSet)
      ? ((passage as PassageWithMeta).tagSet as string[])
      : [];

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