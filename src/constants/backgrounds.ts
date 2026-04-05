import { ImageSourcePropType } from 'react-native';

export type BackgroundOrientation = 'portrait' | 'landscape';

export type BackgroundConfig = {
  id: string;
  portrait: ImageSourcePropType;
};

export const BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'bg01',
    portrait: require('../../assets/backgrounds/portrait/bg01.jpg'),
  },
  {
    id: 'bg02',
    portrait: require('../../assets/backgrounds/portrait/bg02.jpg'),
  },
  {
    id: 'bg03',
    portrait: require('../../assets/backgrounds/portrait/bg03.jpg'),
  },
  {
    id: 'bg04',
    portrait: require('../../assets/backgrounds/portrait/bg04.jpg'),
  },
  {
    id: 'bg05',
    portrait: require('../../assets/backgrounds/portrait/bg05.jpg'),
  },
  {
    id: 'bg06',
    portrait: require('../../assets/backgrounds/portrait/bg06.jpg'),
  },
  {
    id: 'bg07',
    portrait: require('../../assets/backgrounds/portrait/bg07.jpg'),
  },
  {
    id: 'bg08',
    portrait: require('../../assets/backgrounds/portrait/bg08.jpg'),
  },
  {
    id: 'bg09',
    portrait: require('../../assets/backgrounds/portrait/bg09.jpg'),
  },
  {
    id: 'bg10',
    portrait: require('../../assets/backgrounds/portrait/bg10.jpg'),
  },
  {
    id: 'bg11',
    portrait: require('../../assets/backgrounds/portrait/bg11.jpg'),
  },
  {
    id: 'bg12',
    portrait: require('../../assets/backgrounds/portrait/bg12.jpg'),
  },
  {
    id: 'bg13',
    portrait: require('../../assets/backgrounds/portrait/bg13.jpg'),
  },
  {
    id: 'bg14',
    portrait: require('../../assets/backgrounds/portrait/bg14.jpg'),
  },
  {
    id: 'bg15',
    portrait: require('../../assets/backgrounds/portrait/bg15.jpg'),
  },
  {
    id: 'bg16',
    portrait: require('../../assets/backgrounds/portrait/bg16.jpg'),
  },
  {
    id: 'bg17',
    portrait: require('../../assets/backgrounds/portrait/bg17.jpg'),
  },
  {
    id: 'bg18',
    portrait: require('../../assets/backgrounds/portrait/bg18.jpg'),
  },
  {
    id: 'bg19',
    portrait: require('../../assets/backgrounds/portrait/bg19.jpg'),
  },
  {
    id: 'bg20',
    portrait: require('../../assets/backgrounds/portrait/bg20.jpg'),
  },
  {
    id: 'bg21',
    portrait: require('../../assets/backgrounds/portrait/bg21.jpg'),
  },
  {
    id: 'bg22',
    portrait: require('../../assets/backgrounds/portrait/bg22.jpg'),
  },
  {
    id: 'bg23',
    portrait: require('../../assets/backgrounds/portrait/bg23.jpg'),
  },
  {
    id: 'bg24',
    portrait: require('../../assets/backgrounds/portrait/bg24.jpg'),
  },
  {
    id: 'bg25',
    portrait: require('../../assets/backgrounds/portrait/bg25.jpg'),
  },
  {
    id: 'bg26',
    portrait: require('../../assets/backgrounds/portrait/bg26.jpg'),
  },
  {
    id: 'bg27',
    portrait: require('../../assets/backgrounds/portrait/bg27.jpg'),
  },
  {
    id: 'bg28',
    portrait: require('../../assets/backgrounds/portrait/bg28.jpg'),
  },
  {
    id: 'bg29',
    portrait: require('../../assets/backgrounds/portrait/bg29.jpg'),
  },
  {
    id: 'bg30',
    portrait: require('../../assets/backgrounds/portrait/bg30.jpg'),
  },
];

export const getBackgroundCount = (): number => BACKGROUNDS.length;

export const getBackgroundAt = (index: number): BackgroundConfig => {
  const count = BACKGROUNDS.length;

  if (count === 0) {
    throw new Error('No backgrounds configured.');
  }

  const normalizedIndex = ((index % count) + count) % count;
  return BACKGROUNDS[normalizedIndex];
};

export const getRandomBackgroundIndex = (): number => {
  if (!BACKGROUNDS.length) {
    return 0;
  }

  return Math.floor(Math.random() * BACKGROUNDS.length);
};

export const getNextBackgroundIndex = (currentIndex: number): number => {
  if (!BACKGROUNDS.length) {
    return 0;
  }

  return (currentIndex + 1) % BACKGROUNDS.length;
};

export const getRandomBackground = (): BackgroundConfig => {
  return getBackgroundAt(getRandomBackgroundIndex());
};