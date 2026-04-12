import type { LanguageOption } from '../types/menu';
import type { NormalizedPassage } from '../types/NormalizedPassage';

type EmotionKey =
  | 'unknown'
  | 'joy'
  | 'hope'
  | 'anxiety'
  | 'depression'
  | 'sadness'
  | 'anger';

export type PassageMeta = {
  author?: string;
  book?: string;
  chapter?: string | number;
  verse?: string | number;
  tradition?: string;
  source?: string;
  reference?: string;
  sourceDisplay?: string;
  referenceDisplay?: string;
  bookDisplay?: string;
  chapterDisplay?: string;
};

type RawPassage = {
  id: string;
  lines?: string[];
  emotionCore?: EmotionKey;
  emotionExtended?: EmotionKey[];
  meta?: PassageMeta;
};

type UnknownRecord = Record<string, unknown>;

type AdaptOptions = {
  category: string;
  domain?: string;
  language: LanguageOption;
};

const AUTHOR_KO_MAP: Record<string, string> = {
  Epictetus: '에픽테토스',
  'Erich Fromm': '에리히 프롬',
  ErichFromm: '에리히 프롬',
  'Marcus Aurelius': '마르쿠스 아우렐리우스',
  MarcusAurelius: '마르쿠스 아우렐리우스',
  Nietzsche: '니체',
  Plato: '플라톤',
  Seneca: '세네카',
  Freud: '프로이트',
  Sartre: '사르트르',
  Socrates: '소크라테스',
  Aristotle: '아리스토텔레스',
};

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value).trim();
  }

  return '';
};

const normalizeLines = (lines: unknown): string[] => {
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .filter((line): line is string => typeof line === 'string')
    .map((line) => line.trim())
    .filter(Boolean);
};

const isEmotionKey = (value: unknown): value is EmotionKey =>
  value === 'unknown' ||
  value === 'joy' ||
  value === 'hope' ||
  value === 'anxiety' ||
  value === 'depression' ||
  value === 'sadness' ||
  value === 'anger';

const normalizeEmotionExtended = (value: unknown): EmotionKey[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isEmotionKey);
};

const normalizeMeta = (meta: unknown): PassageMeta | undefined => {
  if (!isRecord(meta)) {
    return undefined;
  }

  const author = toTrimmedString(meta.author);
  const book = toTrimmedString(meta.book) || toTrimmedString(meta.source);
  const chapter = toTrimmedString(meta.chapter) || toTrimmedString(meta.reference);
  const source = toTrimmedString(meta.source) || book;
  const reference = toTrimmedString(meta.reference) || chapter;

  const bookDisplay =
    toTrimmedString(meta.bookDisplay) ||
    toTrimmedString(meta.sourceDisplay) ||
    book;

  const chapterDisplay =
    toTrimmedString(meta.chapterDisplay) ||
    toTrimmedString(meta.referenceDisplay) ||
    chapter;

  const sourceDisplay =
    toTrimmedString(meta.sourceDisplay) ||
    toTrimmedString(meta.bookDisplay) ||
    source;

  const referenceDisplay =
    toTrimmedString(meta.referenceDisplay) ||
    toTrimmedString(meta.chapterDisplay) ||
    reference;

  const verseRaw = meta.verse;
  const verse =
    typeof verseRaw === 'string' || typeof verseRaw === 'number'
      ? String(verseRaw).trim()
      : '';

  const tradition = toTrimmedString(meta.tradition);

  const normalized: PassageMeta = {};

  if (author) normalized.author = author;
  if (book) normalized.book = book;
  if (chapter) normalized.chapter = chapter;
  if (verse) normalized.verse = verse;
  if (tradition) normalized.tradition = tradition;
  if (source) normalized.source = source;
  if (reference) normalized.reference = reference;
  if (sourceDisplay) normalized.sourceDisplay = sourceDisplay;
  if (referenceDisplay) normalized.referenceDisplay = referenceDisplay;
  if (bookDisplay) normalized.bookDisplay = bookDisplay;
  if (chapterDisplay) normalized.chapterDisplay = chapterDisplay;

  return Object.keys(normalized).length ? normalized : undefined;
};

const normalizePassage = (raw: unknown): RawPassage | null => {
  if (!isRecord(raw)) {
    return null;
  }

  const id = toTrimmedString(raw.id);
  if (!id) {
    return null;
  }

  const lines = normalizeLines(raw.lines);
  if (!lines.length) {
    return null;
  }

  const emotionCore = isEmotionKey(raw.emotionCore) ? raw.emotionCore : undefined;

  return {
    id,
    lines,
    emotionCore,
    emotionExtended: normalizeEmotionExtended(raw.emotionExtended),
    meta: normalizeMeta(raw.meta),
  };
};

const looksLikePassageArray = (value: unknown): value is unknown[] =>
  Array.isArray(value) && value.some((item) => isRecord(item) && ('id' in item || 'lines' in item));

const extractRawPassages = (input: unknown): unknown[] => {
  if (isRecord(input) && Array.isArray(input.passages)) {
    return input.passages;
  }

  if (Array.isArray(input)) {
    if (looksLikePassageArray(input)) {
      return input;
    }

    for (const item of input) {
      if (isRecord(item) && Array.isArray(item.passages)) {
        return item.passages;
      }
    }
  }

  return [];
};

export function adaptPassageFile(input: unknown, options: AdaptOptions): NormalizedPassage[] {
  const rawPassages = extractRawPassages(input);

  return rawPassages
    .map(normalizePassage)
    .filter((item): item is RawPassage => item !== null)
    .map((passage) => ({
      id: passage.id,
      lines: passage.lines,
      sourceText: buildSourceText(passage.meta, options),
      emotionCore: passage.emotionCore ?? 'unknown',
      emotionExtended: passage.emotionExtended ?? [],
      meta: passage.meta, // ✅ AI tradition 보존
      tags: {
        category: options.category,
        domain: options.domain,
        language: options.language,
      },
    }));
}

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function formatParenLabel(label: string, content: string): string {
  const safeLabel = normalizeSpace(label);
  const safeContent = normalizeSpace(content);

  if (!safeLabel && !safeContent) {
    return '';
  }

  if (!safeContent) {
    return safeLabel;
  }

  if (!safeLabel) {
    return safeContent;
  }

  return `${safeLabel} (${safeContent})`;
}

function removeLeadingDuplicate(value: string, duplicate: string): string {
  const safeValue = normalizeSpace(value);
  const safeDuplicate = normalizeSpace(duplicate);

  if (!safeValue || !safeDuplicate) {
    return safeValue;
  }

  if (safeValue === safeDuplicate) {
    return '';
  }

  if (safeValue.startsWith(`${safeDuplicate} `)) {
    return safeValue.slice(safeDuplicate.length).trim();
  }

  return safeValue;
}

function getKoreanAuthorName(author: string): string {
  const safeAuthor = normalizeSpace(author);
  return AUTHOR_KO_MAP[safeAuthor] || safeAuthor;
}

function joinBookAndChapter(bookDisplay: string, chapterDisplay: string): string {
  const safeBook = normalizeSpace(bookDisplay);
  const safeChapter = normalizeSpace(chapterDisplay);

  if (!safeBook && !safeChapter) {
    return '';
  }

  if (!safeBook) {
    return safeChapter;
  }

  if (!safeChapter) {
    return safeBook;
  }

  const chapterWithoutBook = removeLeadingDuplicate(safeChapter, safeBook);
  return chapterWithoutBook ? `${safeBook} ${chapterWithoutBook}` : safeBook;
}

function buildPoetryLabel(meta: PassageMeta | undefined): string {
  if (!meta) {
    return '';
  }

  const author =
    typeof meta.author === 'string' ? normalizeSpace(meta.author) : '';

  const chapterDisplay =
    typeof meta.chapterDisplay === 'string' ? normalizeSpace(meta.chapterDisplay) : '';

  const referenceDisplay =
    typeof meta.referenceDisplay === 'string' ? normalizeSpace(meta.referenceDisplay) : '';

  const chapter =
    typeof meta.chapter === 'string' || typeof meta.chapter === 'number'
      ? normalizeSpace(String(meta.chapter))
      : '';

  const reference =
    typeof meta.reference === 'string' || typeof meta.reference === 'number'
      ? normalizeSpace(String(meta.reference))
      : '';

  const bookDisplay =
    typeof meta.bookDisplay === 'string' ? normalizeSpace(meta.bookDisplay) : '';

  const book =
    typeof meta.book === 'string' || typeof meta.book === 'number'
      ? normalizeSpace(String(meta.book))
      : '';

  const title =
    chapterDisplay ||
    chapter ||
    referenceDisplay ||
    reference ||
    '';

  const fallbackTitle = bookDisplay || book || '';

  return formatParenLabel(author, title || fallbackTitle);
}

export function buildSourceText(
  meta: PassageMeta | undefined,
  options?: Pick<AdaptOptions, 'category' | 'domain'>,
): string {
  if (!meta) {
    return '';
  }

  const category = options?.category ?? '';
  const domain = options?.domain ?? '';

  const author = typeof meta.author === 'string' ? meta.author.trim() : '';
  const book = typeof meta.book === 'string' ? meta.book.trim() : '';
  const source = typeof meta.source === 'string' ? meta.source.trim() : '';
  const reference = typeof meta.reference === 'string' ? meta.reference.trim() : '';

  const bookDisplay =
    typeof meta.bookDisplay === 'string' ? meta.bookDisplay.trim() : '';
  const chapterDisplay =
    typeof meta.chapterDisplay === 'string' ? meta.chapterDisplay.trim() : '';
  const sourceDisplay =
    typeof meta.sourceDisplay === 'string' ? meta.sourceDisplay.trim() : '';
  const referenceDisplay =
    typeof meta.referenceDisplay === 'string' ? meta.referenceDisplay.trim() : '';

  const displayBook = bookDisplay || book || sourceDisplay || source;
  const displayChapter = chapterDisplay || referenceDisplay || reference;
  const displayReference = referenceDisplay || chapterDisplay || reference;

  if (domain === 'literature' && category === 'eastern_poetry') {
    return buildPoetryLabel(meta);
  }

  if (domain === 'literature' && category === 'western_poetry') {
    return buildPoetryLabel(meta);
  }

  if (domain === 'philosophy' && category === 'eastern_philosophy') {
    return formatParenLabel(displayBook, displayChapter);
  }

  if (domain === 'philosophy' && category === 'western_philosophy') {
    const koreanAuthor = getKoreanAuthorName(author);
    return formatParenLabel(koreanAuthor, displayBook);
  }

  if (domain === 'religion' && category === 'christianity') {
    return formatParenLabel('성경', displayReference);
  }

  if (domain === 'religion' && category === 'buddhism') {
    const buddhistInner = joinBookAndChapter(displayBook, displayChapter);
    return formatParenLabel('불교', buddhistInner);
  }

  if (domain === 'religion' && category === 'islam') {
    return formatParenLabel('코란', displayReference);
  }

  if (domain === 'philosophy') {
    const koreanAuthor = getKoreanAuthorName(author);
    return formatParenLabel(koreanAuthor, displayBook);
  }

  if (domain === 'religion') {
    return formatParenLabel(sourceDisplay || source, displayReference);
  }

  if (author && displayBook) {
    return formatParenLabel(author, displayBook);
  }

  return formatParenLabel(
    displayBook || sourceDisplay || source,
    displayReference || displayChapter,
  );
}