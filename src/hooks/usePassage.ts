import { useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  ContentCategory,
  LanguageOption,
  MenuSelectionState,
} from '../types/menu';
import type { NormalizedPassage } from '../types/NormalizedPassage';

import easternClassicsMixKo from '../data/passages/eastern/ko/classics_mix.json';
import easternConfuciusKo from '../data/passages/eastern/ko/confucius.json';
import easternEasternMis01Ko from '../data/passages/eastern/ko/EASTERN_MIS 01.json';
import easternEasternMis02Ko from '../data/passages/eastern/ko/EASTERN_MIS 02.json';
import easternEasternMis03Ko from '../data/passages/eastern/ko/EASTERN_MIS 03.json';
import easternLaoziKo from '../data/passages/eastern/ko/laozi.json';
import easternMenciusKo from '../data/passages/eastern/ko/mencius.json';
import easternZhuangziKo from '../data/passages/eastern/ko/zhuangzi.json';

import westernEpictetusKo from '../data/passages/western/ko/epictetus.json';
import westernErichFrommKo from '../data/passages/western/ko/Erich Fromm.json';
import westernMarcusAureliusKo from '../data/passages/western/ko/marcus_aurelius.json';
import westernNietzsche01Ko from '../data/passages/western/ko/nietzsche_01.json';
import westernNietzsche02Ko from '../data/passages/western/ko/nietzsche_02.json';
import westernNietzsche03Ko from '../data/passages/western/ko/nietzsche_03.json';
import westernPlatoKo from '../data/passages/western/ko/Plato.json';
import westernSartreFreudKo from '../data/passages/western/ko/sartre_freud.json';
import westernSenecaKo from '../data/passages/western/ko/seneca.json';
import westernWesternMisc01Ko from '../data/passages/western/ko/western_misc_01.json';

import buddhismDhammapadaKo from '../data/passages/religion/buddhism/ko/dhammapada.ko.json';
import buddhismDiamondSutraKo from '../data/passages/religion/buddhism/ko/diamond_sutra.ko.json';
import buddhismHeartSutraKo from '../data/passages/religion/buddhism/ko/heart_sutra_ko.json';
import buddhismMixedSutrasKo from '../data/passages/religion/buddhism/ko/mixed_sutras.ko.json';

import christianityBibleNtPart1Ko from '../data/passages/religion/christianity/ko/bible_nt_part1.json';
import christianityBibleNtPart2Ko from '../data/passages/religion/christianity/ko/bible_nt_part2.json';
import christianityBibleOtPart1Ko from '../data/passages/religion/christianity/ko/bible_ot_part1.json';
import christianityBibleOtPart2Ko from '../data/passages/religion/christianity/ko/bible_ot_part2.json';

import islamQuranPart1Ko from '../data/passages/religion/islam/ko/quran_part1.json';
import islamQuranPart2Ko from '../data/passages/religion/islam/ko/quran_part2.json';
import islamQuranPart3Ko from '../data/passages/religion/islam/ko/quran_part3.json';
import islamQuranPart4Ko from '../data/passages/religion/islam/ko/quran_part4.json';

import { adaptPassageFile } from './passageAdapter';

export type PassagePickResult = {
  id: string;
  lines: string[];
  sourceText: string;
};

type LibraryEntry = {
  loader: () => unknown;
  category: string;
  domain?: string;
  language: LanguageOption;
};

type LibraryCache = Partial<Record<LanguageOption, NormalizedPassage[]>>;

const PASSAGE_SOURCES: LibraryEntry[] = [
  {
    loader: () => easternClassicsMixKo,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternConfuciusKo,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternEasternMis01Ko,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternEasternMis02Ko,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternEasternMis03Ko,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternLaoziKo,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternMenciusKo,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => easternZhuangziKo,
    category: 'eastern_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },

  {
    loader: () => westernEpictetusKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernErichFrommKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernMarcusAureliusKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernNietzsche01Ko,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernNietzsche02Ko,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernNietzsche03Ko,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernPlatoKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernSartreFreudKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernSenecaKo,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },
  {
    loader: () => westernWesternMisc01Ko,
    category: 'western_philosophy',
    domain: 'philosophy',
    language: 'ko',
  },

  {
    loader: () => buddhismDhammapadaKo,
    category: 'buddhism',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => buddhismDiamondSutraKo,
    category: 'buddhism',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => buddhismHeartSutraKo,
    category: 'buddhism',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => buddhismMixedSutrasKo,
    category: 'buddhism',
    domain: 'religion',
    language: 'ko',
  },

  {
    loader: () => christianityBibleNtPart1Ko,
    category: 'christianity',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => christianityBibleNtPart2Ko,
    category: 'christianity',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => christianityBibleOtPart1Ko,
    category: 'christianity',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => christianityBibleOtPart2Ko,
    category: 'christianity',
    domain: 'religion',
    language: 'ko',
  },

  {
    loader: () => islamQuranPart1Ko,
    category: 'islam',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => islamQuranPart2Ko,
    category: 'islam',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => islamQuranPart3Ko,
    category: 'islam',
    domain: 'religion',
    language: 'ko',
  },
  {
    loader: () => islamQuranPart4Ko,
    category: 'islam',
    domain: 'religion',
    language: 'ko',
  },
];

const LIBRARY_CACHE: LibraryCache = {};

export function usePassage(selections: MenuSelectionState) {
  const safeSelections = useMemo(
    () => normalizeSelections(selections),
    [selections],
  );

  const library = useMemo(
    () => getLibraryForLanguage(safeSelections.language),
    [safeSelections.language],
  );

  const categoryFilters = useMemo(
    () => deriveCategoryFilters(safeSelections.selectedCategories),
    [safeSelections.selectedCategories],
  );

  const emotionFiltered = useMemo(
    () => filterPassagesByEmotion(library, safeSelections),
    [library, safeSelections],
  );

  const categoryPassageMap = useMemo(
    () => buildCategoryPassageMap(emotionFiltered, categoryFilters),
    [emotionFiltered, categoryFilters],
  );

  const availableCategories = useMemo(
    () =>
      categoryFilters.filter((category) => {
        const passages = categoryPassageMap[category];
        return Array.isArray(passages) && passages.length > 0;
      }),
    [categoryFilters, categoryPassageMap],
  );

  const hasPassages = availableCategories.length > 0;

  const rotationPoolRef = useRef<string[]>([]);
  const rotationSignature = useMemo(
    () =>
      JSON.stringify({
        language: safeSelections.language,
        emotion: safeSelections.emotion,
        categories: availableCategories,
      }),
    [availableCategories, safeSelections.emotion, safeSelections.language],
  );

  useEffect(() => {
    rotationPoolRef.current = [];
  }, [rotationSignature]);

  const pickNextPassage = useCallback(
    (excludeIds: string[] = []): PassagePickResult | null => {
      if (!availableCategories.length) {
        return null;
      }

      const excludeSet = new Set(excludeIds);
      const selectedCategories = availableCategories;

      const ensurePool = (): string[] => {
        const normalizedCurrentPool = rotationPoolRef.current.filter((category) =>
          selectedCategories.includes(category),
        );

        if (normalizedCurrentPool.length > 0) {
          rotationPoolRef.current = normalizedCurrentPool;
          return normalizedCurrentPool;
        }

        rotationPoolRef.current = [...selectedCategories];
        return rotationPoolRef.current;
      };

      const findPickableCategories = (categories: string[]): string[] =>
        categories.filter((category) => {
          const passages = categoryPassageMap[category] ?? [];
          return passages.some((passage) => !excludeSet.has(passage.id));
        });

      let pool = ensurePool();
      let candidateCategories = findPickableCategories(pool);

      if (!candidateCategories.length) {
        if (pool.length !== selectedCategories.length) {
          rotationPoolRef.current = [...selectedCategories];
          pool = rotationPoolRef.current;
          candidateCategories = findPickableCategories(pool);
        }
      }

      let targetCategory: string | null = null;

      if (candidateCategories.length > 0) {
        targetCategory = pickRandomItem(candidateCategories) ?? null;
      } else {
        const fallbackPool = pool.length ? pool : selectedCategories;
        targetCategory = pickRandomItem(fallbackPool) ?? null;
      }

      if (!targetCategory) {
        return null;
      }

      const passagesInCategory = categoryPassageMap[targetCategory] ?? [];
      if (!passagesInCategory.length) {
        return null;
      }

      const unexcludedPassages = passagesInCategory.filter(
        (passage) => !excludeSet.has(passage.id),
      );
      const targetPassagePool =
        unexcludedPassages.length > 0 ? unexcludedPassages : passagesInCategory;

      const picked = pickRandomItem(targetPassagePool);
      if (!picked) {
        return null;
      }

      rotationPoolRef.current = removeCategoryOnce(rotationPoolRef.current, targetCategory);

      if (!rotationPoolRef.current.length) {
        rotationPoolRef.current = [...selectedCategories];
      }

      return {
        id: picked.id,
        lines: picked.lines,
        sourceText: picked.sourceText,
      };
    },
    [availableCategories, categoryPassageMap],
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

  const entries = PASSAGE_SOURCES.filter((entry) => entry.language === language);
  const library = buildPassageLibrary(entries);
  LIBRARY_CACHE[language] = library;
  return library;
}

function buildPassageLibrary(entries: LibraryEntry[]): NormalizedPassage[] {
  const records: NormalizedPassage[] = [];

  entries.forEach(({ loader, category, domain, language }) => {
    const rawFile = loader();
    const normalized = adaptPassageFile(rawFile, { category, domain, language });
    records.push(...normalized);
  });

  return records;
}

function normalizeSelections(input: MenuSelectionState | null | undefined): MenuSelectionState {
  return {
    emotion: isEmotionKey(input?.emotion) ? input.emotion : 'unknown',
    selectedCategories: Array.isArray(input?.selectedCategories)
      ? input.selectedCategories.filter(Boolean)
      : [],
    language: input?.language ?? 'ko',
    font: input?.font ?? 'basic',
    size: input?.size ?? 'large',
    background: input?.background ?? 'auto',
  };
}

type EmotionKey = MenuSelectionState['emotion'];

function isEmotionKey(value: unknown): value is EmotionKey {
  return (
    value === 'unknown' ||
    value === 'joy' ||
    value === 'hope' ||
    value === 'anxiety' ||
    value === 'depression' ||
    value === 'sadness'
  );
}

function deriveCategoryFilters(selected: ContentCategory[] | undefined): string[] {
  if (!Array.isArray(selected) || !selected.length) {
    return [];
  }

  const mapped = selected
    .map(mapMenuCategoryToTag)
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(mapped));
}

function mapMenuCategoryToTag(category: ContentCategory): string | null {
  return category ?? null;
}

function filterPassagesByEmotion(
  passages: NormalizedPassage[],
  selections: MenuSelectionState,
): NormalizedPassage[] {
  return passages.filter((passage) => {
    if (selections.emotion === 'unknown') {
      return true;
    }

    return (
      passage.emotionCore === selections.emotion ||
      passage.emotionExtended.includes(selections.emotion)
    );
  });
}

function buildCategoryPassageMap(
  passages: NormalizedPassage[],
  categoryFilters: string[],
): Record<string, NormalizedPassage[]> {
  if (!categoryFilters.length) {
    return {};
  }

  const filterSet = new Set(categoryFilters);
  const map: Record<string, NormalizedPassage[]> = {};

  passages.forEach((passage) => {
    const category = passage.tags.category;

    if (!filterSet.has(category)) {
      return;
    }

    if (!map[category]) {
      map[category] = [];
    }

    map[category].push(passage);
  });

  return map;
}

function removeCategoryOnce(categories: string[], target: string): string[] {
  const index = categories.indexOf(target);

  if (index < 0) {
    return categories;
  }

  return [...categories.slice(0, index), ...categories.slice(index + 1)];
}

function pickRandomItem<T>(items: T[]): T | null {
  if (!items.length) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}