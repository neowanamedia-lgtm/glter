import type { EmotionKey, LanguageOption } from './menu';

export type PassageTags = {
  category: string;
  domain?: string;
  language?: LanguageOption;
};

export type NormalizedPassage = {
  id: string;
  lines: string[];
  sourceText: string;
  emotionCore: EmotionKey;
  emotionExtended: EmotionKey[];
  tags: PassageTags;
};
