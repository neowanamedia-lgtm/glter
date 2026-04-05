import { useCallback, useMemo } from 'react';

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

  const filtered = useMemo(
    () => filterPassages(library, safeSelections, categoryFilters),
    [library, safeSelections, categoryFilters],
  );

  const pickNextPassage = useCallback(
    (excludeIds: string[] = []): PassagePickResult | null => {
      if (!filtered.length) {
        return null;
      }

      const excludeSet = new Set(excludeIds);
      const candidatePool =
        filtered.length > excludeSet.size
          ? filtered.filter((passage) => !excludeSet.has(passage.id))
          : filtered;

      const pool = candidatePool.length ? candidatePool : filtered;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const picked = pool[randomIndex];

      if (!picked) {
        return null;
      }

      return {
        id: picked.id,
        lines: picked.lines,
        sourceText: picked.sourceText,
      };
    },
    [filtered],
  );

  return {
    hasPassages: filtered.length > 0,
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

function filterPassages(
  passages: NormalizedPassage[],
  selections: MenuSelectionState,
  categoryFilters: string[],
): NormalizedPassage[] {
  return passages.filter((passage) => {
    const categoryMatch =
      !categoryFilters.length || categoryFilters.includes(passage.tags.category);

    if (!categoryMatch) {
      return false;
    }

    if (selections.emotion === 'unknown') {
      return true;
    }

    return (
      passage.emotionCore === selections.emotion ||
      passage.emotionExtended.includes(selections.emotion)
    );
  });
}