import React, { useMemo, useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const LANGUAGE_ORDER = ['ko', 'en', 'ja', 'zh', 'es', 'ar'] as const;
const EMOTION_ORDER = ['none', 'joy', 'hope', 'anxiety', 'depression', 'sadness'] as const;

type LanguageValue = typeof LANGUAGE_ORDER[number];

type EmotionValue = 'joy' | 'hope' | 'anxiety' | 'depression' | 'sadness' | 'none';
type PhilosophyValue = 'eastern' | 'western';
type ReligionValue = 'christianity' | 'buddhism' | 'islam';
type FontValue = 'default' | 'soft' | 'handwriting';
type BackgroundValue = 'auto' | 'fixed';

type LocaleCopy = {
  tagline: string;
};

type LabelMap<T extends string> = Record<T, Record<LanguageValue, string>>;

const LOCALE_COPY: Record<LanguageValue, LocaleCopy> = {
  ko: {
    tagline: '지금, 나에게 맞는 문장을 만나는 공간',
  },
  en: {
    tagline: 'A space where you meet the right passage for you now',
  },
  ja: {
    tagline: 'いまの自分にふさわしい文章と出会う場所',
  },
  zh: {
    tagline: '此刻遇见适合自己的句子',
  },
  es: {
    tagline: 'Un espacio para encontrar la frase adecuada para ti ahora',
  },
  ar: {
    tagline: 'مساحة للقاء المقطع المناسب لك الآن',
  },
};

const CTA_LABELS: Record<LanguageValue, string> = {
  ko: '문장 보기',
  en: 'View Passage',
  ja: '文章を見る',
  zh: '文章查看',
  es: 'Ver texto',
  ar: 'عرض النص',
};

const EMOTION_LABELS: LabelMap<EmotionValue> = {
  joy: { ko: '기쁨', en: 'Joy', ja: '喜び', zh: '喜悦', es: 'Alegría', ar: 'فرح' },
  hope: { ko: '희망', en: 'Hope', ja: '希望', zh: '希望', es: 'Esperanza', ar: 'أمل' },
  anxiety: { ko: '불안', en: 'Anxiety', ja: '不安', zh: '焦虑', es: 'Ansiedad', ar: 'قلق' },
  depression: { ko: '우울', en: 'Depression', ja: '抑うつ', zh: '抑郁', es: 'Depresión', ar: 'اكتئاب' },
  sadness: { ko: '슬픔', en: 'Sadness', ja: '悲しみ', zh: '悲伤', es: 'Tristeza', ar: 'حزن' },
  none: { ko: '알 수 없음', en: 'Unknown', ja: '未知', zh: '未知', es: 'Aleatorio', ar: 'غير معروف' },
};

const PHILOSOPHY_LABELS: LabelMap<'eastern' | 'western' | 'all'> = {
  eastern: { ko: '동양 철학', en: 'Eastern', ja: '東洋哲学', zh: '东方哲学', es: 'Oriental', ar: 'شرقية' },
  western: { ko: '서양 철학', en: 'Western', ja: '西洋哲学', zh: '西方哲学', es: 'Occidental', ar: 'غربية' },
  all: { ko: '전체', en: 'All', ja: 'すべて', zh: '全部', es: 'Todos', ar: 'الكل' },
};

const RELIGION_LABELS: LabelMap<'christianity' | 'buddhism' | 'islam' | 'none'> = {
  christianity: { ko: '기독교', en: 'Christianity', ja: 'キリスト教', zh: '基督教', es: 'Cristianismo', ar: 'المسيحية' },
  buddhism: { ko: '불교', en: 'Buddhism', ja: '仏教', zh: '佛教', es: 'Budismo', ar: 'البوذية' },
  islam: { ko: '이슬람', en: 'Islam', ja: 'イスラム', zh: '伊斯兰', es: 'Islam', ar: 'الإسلام' },
  none: { ko: '선택 안함', en: 'None', ja: '選択しない', zh: '不选择', es: 'Ninguna', ar: 'بلا اختيار' },
};

const LANGUAGE_LABELS: LabelMap<LanguageValue> = {
  ko: { ko: '한국어', en: 'Korean', ja: '韓国語', zh: '韩语', es: 'Coreano', ar: 'الكورية' },
  en: { ko: '영어', en: 'English', ja: '英語', zh: '英语', es: 'Inglés', ar: 'الإنجليزية' },
  ja: { ko: '일본어', en: 'Japanese', ja: '日本語', zh: '日语', es: 'Japonés', ar: 'اليابانية' },
  zh: { ko: '중국어', en: 'Chinese', ja: '中国語', zh: '中文', es: 'Chino', ar: 'الصينية' },
  es: { ko: '스페인어', en: 'Spanish', ja: 'スペイン語', zh: '西班牙语', es: 'Español', ar: 'الإسبانية' },
  ar: { ko: '아랍어', en: 'Arabic', ja: 'アラビア語', zh: '阿拉伯语', es: 'Árabe', ar: 'العربية' },
};

const FONT_LABELS: LabelMap<FontValue> = {
  default: { ko: '기본', en: 'Default', ja: '標準', zh: '默认', es: 'Predeterm.', ar: 'افتراضي' },
  soft: { ko: '부드러운', en: 'Soft', ja: 'やわらか', zh: '柔和', es: 'Suave', ar: 'ناعم' },
  handwriting: { ko: '필기체', en: 'Handwriting', ja: '手書き', zh: '手写', es: 'Manuscr.', ar: 'مخطوطة' },
};

const BACKGROUND_LABELS: LabelMap<BackgroundValue> = {
  auto: { ko: '자동', en: 'Auto', ja: '自動', zh: '自动', es: 'Automático', ar: 'تلقائي' },
  fixed: { ko: '고정', en: 'Fixed', ja: '固定', zh: '固定', es: 'Fijo', ar: 'ثابت' },
};

const SECTION_LABELS: Record<LanguageValue, Record<string, string>> = {
  ko: { emotion: '감정', philosophy: '철학', religion: '종교', language: '언어', font: '서체', background: '배경' },
  en: { emotion: 'Emotion', philosophy: 'Philosophy', religion: 'Religion', language: 'Language', font: 'Font', background: 'Background' },
  ja: { emotion: '感情', philosophy: '哲学', religion: '宗教', language: '言語', font: 'フォント', background: '背景' },
  zh: { emotion: '情绪', philosophy: '哲学', religion: '宗教', language: '语言', font: '字体', background: '背景' },
  es: { emotion: 'Emoción', philosophy: 'Filosofía', religion: 'Religión', language: 'Idioma', font: 'Tipografía', background: 'Fondo' },
  ar: { emotion: 'الشعور', philosophy: 'الفلسفة', religion: 'الديانة', language: 'اللغة', font: 'الخط', background: 'الخلفية' },
};

const PRIMARY = '#57A8FF';
const PRIMARY_PRESSED = '#3F96F5';
const LIGHT_BG = '#EAF4FF';
const LABEL_COLOR = '#2F6FB8';
const BORDER_COLOR = '#C9D7EA';

const MENU_BACKGROUNDS = [
  require('../../assets/backgrounds/portrait/bg01.jpg'),
  require('../../assets/backgrounds/portrait/bg02.jpg'),
  require('../../assets/backgrounds/portrait/bg03.jpg'),
  require('../../assets/backgrounds/portrait/bg04.jpg'),
  require('../../assets/backgrounds/portrait/bg05.jpg'),
  require('../../assets/backgrounds/portrait/bg06.jpg'),
  require('../../assets/backgrounds/portrait/bg07.jpg'),
  require('../../assets/backgrounds/portrait/bg08.jpg'),
  require('../../assets/backgrounds/portrait/bg09.jpg'),
  require('../../assets/backgrounds/portrait/bg10.jpg'),
  require('../../assets/backgrounds/portrait/bg11.jpg'),
  require('../../assets/backgrounds/portrait/bg12.jpg'),
  require('../../assets/backgrounds/portrait/bg13.jpg'),
  require('../../assets/backgrounds/portrait/bg14.jpg'),
  require('../../assets/backgrounds/portrait/bg15.jpg'),
  require('../../assets/backgrounds/portrait/bg16.jpg'),
  require('../../assets/backgrounds/portrait/bg17.jpg'),
  require('../../assets/backgrounds/portrait/bg18.jpg'),
  require('../../assets/backgrounds/portrait/bg19.jpg'),
  require('../../assets/backgrounds/portrait/bg20.jpg'),
  require('../../assets/backgrounds/portrait/bg21.jpg'),
  require('../../assets/backgrounds/portrait/bg22.jpg'),
  require('../../assets/backgrounds/portrait/bg23.jpg'),
  require('../../assets/backgrounds/portrait/bg24.jpg'),
  require('../../assets/backgrounds/portrait/bg25.jpg'),
  require('../../assets/backgrounds/portrait/bg26.jpg'),
  require('../../assets/backgrounds/portrait/bg27.jpg'),
  require('../../assets/backgrounds/portrait/bg28.jpg'),
  require('../../assets/backgrounds/portrait/bg29.jpg'),
  require('../../assets/backgrounds/portrait/bg30.jpg'),
];

const MenuScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [language, setLanguage] = useState<LanguageValue>('ko');
  const [emotion, setEmotion] = useState<EmotionValue>('joy');
  const [philosophy, setPhilosophy] = useState<PhilosophyValue[]>([]);
  const [religion, setReligion] = useState<ReligionValue[]>([]);
  const [font, setFont] = useState<FontValue>('default');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundValue>('auto');
  const [backgroundSource] = useState(() => {
    const index = Math.floor(Math.random() * MENU_BACKGROUNDS.length);
    return MENU_BACKGROUNDS[index];
  });

  const localeCopy = useMemo(() => LOCALE_COPY[language], [language]);
  const sectionLabel = useMemo(() => SECTION_LABELS[language], [language]);
  const ctaLabel = CTA_LABELS[language];

  const togglePhilosophy = (value: PhilosophyValue | 'all') => {
    if (value === 'all') {
      setPhilosophy([]);
      return;
    }
    setPhilosophy((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleReligion = (value: ReligionValue | 'none') => {
    if (value === 'none') {
      setReligion([]);
      return;
    }
    setReligion((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} blurRadius={16}>
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top + 12 }]}>
          <View style={styles.contentWrapper}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <Text style={styles.logo}>Seloa</Text>
                <Text style={styles.tagline}>{localeCopy.tagline}</Text>
              </View>

              <SectionRow label={sectionLabel.emotion}>
                {EMOTION_ORDER.map((value) => (
                  <Chip
                    key={value}
                    label={EMOTION_LABELS[value][language]}
                    selected={emotion === value}
                    onPress={() => setEmotion(value)}
                  />
                ))}
              </SectionRow>

              <SectionRow label={sectionLabel.philosophy}>
                {(['all', 'eastern', 'western'] as Array<'all' | PhilosophyValue>).map((value) => (
                  <Chip
                    key={value}
                    label={PHILOSOPHY_LABELS[value][language]}
                    selected={value === 'all' ? philosophy.length === 0 : philosophy.includes(value as PhilosophyValue)}
                    onPress={() => togglePhilosophy(value)}
                  />
                ))}
              </SectionRow>

              <SectionRow label={sectionLabel.religion}>
                {(['none', 'christianity', 'buddhism', 'islam'] as Array<'none' | ReligionValue>).map((value) => (
                  <Chip
                    key={value}
                    label={RELIGION_LABELS[value][language]}
                    selected={value === 'none' ? religion.length === 0 : religion.includes(value as ReligionValue)}
                    onPress={() => toggleReligion(value)}
                  />
                ))}
              </SectionRow>

              <SectionRow label={sectionLabel.language}>
                {LANGUAGE_ORDER.map((value) => (
                  <Chip
                    key={value}
                    label={LANGUAGE_LABELS[value][language]}
                    selected={language === value}
                    onPress={() => setLanguage(value)}
                  />
                ))}
              </SectionRow>

              <SectionRow label={sectionLabel.font}>
                {(['default', 'soft', 'handwriting'] as FontValue[]).map((value) => (
                  <Chip
                    key={value}
                    label={FONT_LABELS[value][language]}
                    selected={font === value}
                    onPress={() => setFont(value)}
                  />
                ))}
              </SectionRow>

              <SectionRow label={sectionLabel.background}>
                {(['auto', 'fixed'] as BackgroundValue[]).map((value) => (
                  <Chip
                    key={value}
                    label={BACKGROUND_LABELS[value][language]}
                    selected={backgroundMode === value}
                    onPress={() => setBackgroundMode(value)}
                  />
                ))}
              </SectionRow>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
              <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                <Text style={styles.ctaLabel}>{ctaLabel}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

const SectionRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionLabel} numberOfLines={1}>
      {label}
    </Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipRow}
      style={styles.chipScroll}
    >
      {children}
    </ScrollView>
  </View>
);

const Chip: React.FC<{ label: string; selected: boolean; onPress: () => void }> = ({
  label,
  selected,
  onPress,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && !selected && styles.chipPressed,
    ]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  header: {
    marginBottom: 16,
  },
  logo: {
    fontSize: 29,
    fontWeight: '600',
    fontFamily: 'Playfair Display',
    color: '#1d2b4a',
  },
  tagline: {
    marginTop: 4,
    fontSize: 24,
    color: '#1d2b4a',
    lineHeight: 33,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    columnGap: 0,
  },
  sectionLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: LABEL_COLOR,
    marginRight: 1,
    minWidth: 32,
    flexShrink: 0,
  },
  chipScroll: {
    flex: 1,
    marginLeft: 0,
  },
  chipRow: {
    flexGrow: 1,
    paddingVertical: 0,
  },
  chip: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 3,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipPressed: {
    backgroundColor: LIGHT_BG,
  },
  chipText: {
    fontSize: 19,
    color: '#1a1a1a',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  cta: {
    borderRadius: 999,
    backgroundColor: PRIMARY,
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignSelf: 'center',
  },
  ctaPressed: {
    backgroundColor: PRIMARY_PRESSED,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
});

export default MenuScreen;