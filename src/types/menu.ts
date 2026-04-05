export type EmotionKey =
  | 'unknown'
  | 'joy'
  | 'hope'
  | 'anxiety'
  | 'depression'
  | 'sadness';

export type ContentCategory =
  | 'eastern_philosophy'
  | 'western_philosophy'
  | 'eastern_poetry'
  | 'western_poetry'
  | 'eastern_novel'
  | 'western_novel'
  | 'christianity'
  | 'buddhism'
  | 'islam';

export type LanguageOption = 'ko' | 'en' | 'ja' | 'zh' | 'es' | 'ar';
export type FontOption = 'basic' | 'soft' | 'script';
export type SizeOption = 'large' | 'small';
export type BackgroundOption = 'auto' | 'upload';

export type MenuSelectionState = {
  emotion: EmotionKey;
  selectedCategories: ContentCategory[];
  language: LanguageOption;
  font: FontOption;
  size: SizeOption;
  background: BackgroundOption;
};

export const INITIAL_MENU_SELECTIONS: MenuSelectionState = {
  emotion: 'unknown',
  selectedCategories: ['eastern_philosophy'],
  language: 'ko',
  font: 'basic',
  size: 'large',
  background: 'auto',
};
