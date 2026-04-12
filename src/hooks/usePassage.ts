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

  const tagFiltered = useMemo(() => {
    const byTags = filterPassagesByTags(library, selectedTags);
    return filterPassagesByAISelection(
      byTags,
      safeFilters.selectedCategories as string[] | undefined,
    );
  }, [library, selectedTags, safeFilters]);

  const emotionAndTagFiltered = useMemo(
    () => filterPassagesByEmotion(tagFiltered, emotion),
    [tagFiltered, emotion],
  );

  const emotionFiltered = useMemo(
    () => filterPassagesByEmotion(library, emotion),
    [library, emotion],
  );

  const fallbackPool = useMemo(() => {
    const hasMyWriting = includeMyWriting && activeMyWritingLibrary.length > 0;

    if (hasMyWriting) {
      return activeMyWritingLibrary;
    }

    if (
      selectedTags.length > 0 ||
      hasAISelected(safeFilters.selectedCategories as string[] | undefined)
    ) {
      if (emotionAndTagFiltered.length > 0) {
        return emotionAndTagFiltered;
      }

      if (tagFiltered.length > 0) {
        return tagFiltered;
      }

      return [];
    }

    if (emotionFiltered.length > 0) {
      return emotionFiltered;
    }

    return library;
  }, [
    includeMyWriting,
    activeMyWritingLibrary,
    selectedTags,
    emotionAndTagFiltered,
    tagFiltered,
    emotionFiltered,
    library,
    safeFilters,
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
        lines: Array.isArray(picked.lines) ? picked.lines : [],
        sourceText: typeof picked.sourceText === 'string' ? picked.sourceText : '',
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

    let normalized: NormalizedPassage[] = [];

    try {
      const adapted = adaptPassageFile(entry.data, {
        category: entry.category,
        domain: entry.domain,
        language: entry.language,
      });

      normalized = Array.isArray(adapted) ? adapted : [];
    } catch (error) {
      console.warn('[usePassage] adaptPassageFile failed:', entry.category, error);
      normalized = [];
    }

    const safeNormalized = normalized
      .filter(isValidNormalizedPassage)
      .map((passage) => {
        const taggedPassage: PassageWithMeta = {
          ...(passage as PassageWithMeta),
          sourceText:
            typeof (passage as PassageWithMeta).sourceText === 'string'
              ? (passage as PassageWithMeta).sourceText
              : '',
          tagSet: [...registryTags],
        };

        return applyNovelSourceText(taggedPassage, registryTags);
      });

    records.push(...safeNormalized);
  });

  return records;
}

function isValidNormalizedPassage(value: unknown): value is NormalizedPassage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<NormalizedPassage>;

  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(candidate.lines) || candidate.lines.length === 0) {
    return false;
  }

  const hasAtLeastOneValidLine = candidate.lines.some(
    (line) => typeof line === 'string' && line.trim().length > 0,
  );

  if (!hasAtLeastOneValidLine) {
    return false;
  }

  return true;
}

function buildMyWritingLibrary(myWritings: MyWriting[]): NormalizedPassage[] {
  return myWritings
    .filter(
      (writing) =>
        writing.active &&
        typeof writing.body === 'string' &&
        writing.body.trim().length > 0,
    )
    .map((writing) => {
      const lines = normalizeMyWritingBodyToLines(writing.body);

      return {
        id: writing.id,
        lines,
        sourceText: '',
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

function filterPassagesByAISelection(
  passages: NormalizedPassage[],
  selectedCategories?: string[],
): NormalizedPassage[] {
  if (!hasAISelected(selectedCategories)) {
    return passages;
  }

  return passages.filter((passage) => {
    const tradition = toCleanString((passage as PassageWithMeta).meta?.tradition);
    return tradition?.toLowerCase() === 'ai';
  });
}

function hasAISelected(selectedCategories?: string[]): boolean {
  if (!Array.isArray(selectedCategories) || !selectedCategories.length) {
    return false;
  }

  return selectedCategories.includes('ai');
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