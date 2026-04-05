import { ImageSourcePropType } from 'react-native';

export type BackgroundOrientation = 'portrait' | 'landscape';

export type BackgroundConfig = {
  id: string;
  portrait: ImageSourcePropType;
  landscape: ImageSourcePropType;
};

export const BACKGROUNDS: BackgroundConfig[] = [
  {
    id: 'bg01',
    portrait: require('../../assets/backgrounds/portrait/bg01.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg01.jpg'),
  },
  {
    id: 'bg02',
    portrait: require('../../assets/backgrounds/portrait/bg02.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg02.jpg'),
  },
  {
    id: 'bg03',
    portrait: require('../../assets/backgrounds/portrait/bg03.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg03.jpg'),
  },
  {
    id: 'bg04',
    portrait: require('../../assets/backgrounds/portrait/bg04.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg04.jpg'),
  },
  {
    id: 'bg05',
    portrait: require('../../assets/backgrounds/portrait/bg05.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg05.jpg'),
  },
  {
    id: 'bg06',
    portrait: require('../../assets/backgrounds/portrait/bg06.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg06.jpg'),
  },
  {
    id: 'bg07',
    portrait: require('../../assets/backgrounds/portrait/bg07.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg07.jpg'),
  },
  {
    id: 'bg08',
    portrait: require('../../assets/backgrounds/portrait/bg08.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg08.jpg'),
  },
  {
    id: 'bg09',
    portrait: require('../../assets/backgrounds/portrait/bg09.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg09.jpg'),
  },
  {
    id: 'bg10',
    portrait: require('../../assets/backgrounds/portrait/bg10.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg10.jpg'),
  },
  {
    id: 'bg11',
    portrait: require('../../assets/backgrounds/portrait/bg11.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg11.jpg'),
  },
  {
    id: 'bg12',
    portrait: require('../../assets/backgrounds/portrait/bg12.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg12.jpg'),
  },
  {
    id: 'bg13',
    portrait: require('../../assets/backgrounds/portrait/bg13.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg13.jpg'),
  },
  {
    id: 'bg14',
    portrait: require('../../assets/backgrounds/portrait/bg14.jpg'),
    landscape: require('../../assets/backgrounds/landscape/bg14.jpg'),
  },
];

export const getRandomBackground = (): BackgroundConfig => {
  const index = Math.floor(Math.random() * BACKGROUNDS.length);
  return BACKGROUNDS[index];
};