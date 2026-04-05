import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export const useOrientation = (): Orientation => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => (height >= width ? 'portrait' : 'landscape'), [height, width]);
};