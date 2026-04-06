import type { LanguageOption } from '../../types/menu';

import easternClassicsMixKo from '../passages/eastern/ko/classics_mix.json';
import easternConfuciusKo from '../passages/eastern/ko/confucius.json';
import easternEasternMis01Ko from '../passages/eastern/ko/EASTERN_MIS 01.json';
import easternEasternMis02Ko from '../passages/eastern/ko/EASTERN_MIS 02.json';
import easternEasternMis03Ko from '../passages/eastern/ko/EASTERN_MIS 03.json';
import easternLaoziKo from '../passages/eastern/ko/laozi.json';
import easternMenciusKo from '../passages/eastern/ko/mencius.json';
import easternZhuangziKo from '../passages/eastern/ko/zhuangzi.json';

import westernEpictetusKo from '../passages/western/ko/epictetus.json';
import westernErichFrommKo from '../passages/western/ko/Erich Fromm.json';
import westernMarcusAureliusKo from '../passages/western/ko/marcus_aurelius.json';
import westernNietzsche01Ko from '../passages/western/ko/nietzsche_01.json';
import westernNietzsche02Ko from '../passages/western/ko/nietzsche_02.json';
import westernNietzsche03Ko from '../passages/western/ko/nietzsche_03.json';
import westernPlatoKo from '../passages/western/ko/Plato.json';
import westernSartreFreudKo from '../passages/western/ko/sartre_freud.json';
import westernSenecaKo from '../passages/western/ko/seneca.json';
import westernWesternMisc01Ko from '../passages/western/ko/western_misc_01.json';

import buddhismDhammapadaKo from '../passages/religion/buddhism/ko/dhammapada.ko.json';
import buddhismDiamondSutraKo from '../passages/religion/buddhism/ko/diamond_sutra.ko.json';
import buddhismHeartSutraKo from '../passages/religion/buddhism/ko/heart_sutra_ko.json';
import buddhismMixedSutrasKo from '../passages/religion/buddhism/ko/mixed_sutras.ko.json';

import christianityBibleNtPart1Ko from '../passages/religion/christianity/ko/bible_nt_part1.json';
import christianityBibleNtPart2Ko from '../passages/religion/christianity/ko/bible_nt_part2.json';
import christianityBibleOtPart1Ko from '../passages/religion/christianity/ko/bible_ot_part1.json';
import christianityBibleOtPart2Ko from '../passages/religion/christianity/ko/bible_ot_part2.json';

import islamQuranPart1Ko from '../passages/religion/islam/ko/quran_part1.json';
import islamQuranPart2Ko from '../passages/religion/islam/ko/quran_part2.json';
import islamQuranPart3Ko from '../passages/religion/islam/ko/quran_part3.json';
import islamQuranPart4Ko from '../passages/religion/islam/ko/quran_part4.json';

import koreanPoetry from '../passages/literature/ko/korean_poetry.json';
import westernPoetry from '../passages/literature/ko/western_poetry.json';

export type RegistryDomain = 'philosophy' | 'religion' | 'literature';

export type PassageRegistryEntry = {
  id: string;
  domain: RegistryDomain;
  category: string;
  language: LanguageOption;
  tags: string[];
  data: unknown;
};

type EntryConfig = {
  id: string;
  domain: RegistryDomain;
  category: string;
  language: LanguageOption;
  source: unknown;
  tags?: string[];
};

const createRegistryEntry = ({
  id,
  domain,
  category,
  language,
  source,
  tags = [],
}: EntryConfig): PassageRegistryEntry => {
  const baseTags = [
    category,
    domain,
    `domain:${domain}`,
    `language:${language}`,
  ];

  const normalizedTags = Array.from(new Set([...baseTags, ...tags]));

  return {
    id,
    domain,
    category,
    language,
    data: source,
    tags: normalizedTags,
  };
};

export const PASSAGE_REGISTRY: PassageRegistryEntry[] = [
  createRegistryEntry({
    id: 'eastern-classics-mix-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternClassicsMixKo,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-confucius-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternConfuciusKo,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-misc-01-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternEasternMis01Ko,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-misc-02-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternEasternMis02Ko,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-misc-03-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternEasternMis03Ko,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-laozi-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternLaoziKo,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-mencius-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternMenciusKo,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'eastern-zhuangzi-ko',
    domain: 'philosophy',
    category: 'eastern_philosophy',
    language: 'ko',
    source: easternZhuangziKo,
    tags: ['domain:philosophy', 'region:east'],
  }),
  createRegistryEntry({
    id: 'western-epictetus-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernEpictetusKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-erich-fromm-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernErichFrommKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-marcus-aurelius-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernMarcusAureliusKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-nietzsche-01-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernNietzsche01Ko,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-nietzsche-02-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernNietzsche02Ko,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-nietzsche-03-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernNietzsche03Ko,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-plato-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernPlatoKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-sartre-freud-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernSartreFreudKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-seneca-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernSenecaKo,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'western-misc-01-ko',
    domain: 'philosophy',
    category: 'western_philosophy',
    language: 'ko',
    source: westernWesternMisc01Ko,
    tags: ['domain:philosophy', 'region:west'],
  }),
  createRegistryEntry({
    id: 'buddhism-dhammapada-ko',
    domain: 'religion',
    category: 'buddhism',
    language: 'ko',
    source: buddhismDhammapadaKo,
    tags: ['domain:religion', 'religion:buddhism'],
  }),
  createRegistryEntry({
    id: 'buddhism-diamond-sutra-ko',
    domain: 'religion',
    category: 'buddhism',
    language: 'ko',
    source: buddhismDiamondSutraKo,
    tags: ['domain:religion', 'religion:buddhism'],
  }),
  createRegistryEntry({
    id: 'buddhism-heart-sutra-ko',
    domain: 'religion',
    category: 'buddhism',
    language: 'ko',
    source: buddhismHeartSutraKo,
    tags: ['domain:religion', 'religion:buddhism'],
  }),
  createRegistryEntry({
    id: 'buddhism-mixed-sutras-ko',
    domain: 'religion',
    category: 'buddhism',
    language: 'ko',
    source: buddhismMixedSutrasKo,
    tags: ['domain:religion', 'religion:buddhism'],
  }),
  createRegistryEntry({
    id: 'christianity-bible-nt-01-ko',
    domain: 'religion',
    category: 'christianity',
    language: 'ko',
    source: christianityBibleNtPart1Ko,
    tags: ['domain:religion', 'religion:christianity'],
  }),
  createRegistryEntry({
    id: 'christianity-bible-nt-02-ko',
    domain: 'religion',
    category: 'christianity',
    language: 'ko',
    source: christianityBibleNtPart2Ko,
    tags: ['domain:religion', 'religion:christianity'],
  }),
  createRegistryEntry({
    id: 'christianity-bible-ot-01-ko',
    domain: 'religion',
    category: 'christianity',
    language: 'ko',
    source: christianityBibleOtPart1Ko,
    tags: ['domain:religion', 'religion:christianity'],
  }),
  createRegistryEntry({
    id: 'christianity-bible-ot-02-ko',
    domain: 'religion',
    category: 'christianity',
    language: 'ko',
    source: christianityBibleOtPart2Ko,
    tags: ['domain:religion', 'religion:christianity'],
  }),
  createRegistryEntry({
    id: 'islam-quran-part-01-ko',
    domain: 'religion',
    category: 'islam',
    language: 'ko',
    source: islamQuranPart1Ko,
    tags: ['domain:religion', 'religion:islam'],
  }),
  createRegistryEntry({
    id: 'islam-quran-part-02-ko',
    domain: 'religion',
    category: 'islam',
    language: 'ko',
    source: islamQuranPart2Ko,
    tags: ['domain:religion', 'religion:islam'],
  }),
  createRegistryEntry({
    id: 'islam-quran-part-03-ko',
    domain: 'religion',
    category: 'islam',
    language: 'ko',
    source: islamQuranPart3Ko,
    tags: ['domain:religion', 'religion:islam'],
  }),
  createRegistryEntry({
    id: 'islam-quran-part-04-ko',
    domain: 'religion',
    category: 'islam',
    language: 'ko',
    source: islamQuranPart4Ko,
    tags: ['domain:religion', 'religion:islam'],
  }),
  createRegistryEntry({
    id: 'literature-korean-poetry-ko',
    domain: 'literature',
    category: 'eastern_poetry',
    language: 'ko',
    source: koreanPoetry,
    tags: [
      'domain:literature',
      'category:eastern_poetry',
      'language:ko',
      'region:korea',
    ],
  }),
  createRegistryEntry({
    id: 'literature-western-poetry-ko',
    domain: 'literature',
    category: 'western_poetry',
    language: 'ko',
    source: westernPoetry,
    tags: [
      'domain:literature',
      'category:western_poetry',
      'language:ko',
      'region:west',
    ],
  }),
];