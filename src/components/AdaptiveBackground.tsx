import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';

import { getRandomBackground, BackgroundConfig } from '../constants/backgrounds';

type AdaptiveBackgroundProps = PropsWithChildren<{
  onReady?: () => void;
  overlayColor?: string;
  blurRadius?: number;
  backgroundMode?: 'auto' | 'user';
  userBackgroundUri?: string | null;
}>;

const INITIAL_FADE_DURATION = 900;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    flex: 1,
  },
});

export const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({
  children,
  onReady,
  overlayColor,
  blurRadius = 0,
  backgroundMode = 'auto',
  userBackgroundUri,
}) => {
  const [selectedBackground, setSelectedBackground] = useState<BackgroundConfig>(() =>
    getRandomBackground(),
  );

  const opacity = useRef(new Animated.Value(0)).current;
  const hasSignaledRef = useRef(false);
  const previousBackgroundModeRef = useRef<'auto' | 'user'>(backgroundMode);

  useEffect(() => {
    const previousMode = previousBackgroundModeRef.current;

    if (backgroundMode === 'auto' && previousMode !== 'auto') {
      setSelectedBackground(getRandomBackground());
    }

    previousBackgroundModeRef.current = backgroundMode;
  }, [backgroundMode]);

  const source = useMemo(() => {
    if (backgroundMode === 'user' && userBackgroundUri) {
      return { uri: userBackgroundUri };
    }

    return selectedBackground.portrait;
  }, [backgroundMode, selectedBackground, userBackgroundUri]);

  useEffect(() => {
    opacity.setValue(0);
    hasSignaledRef.current = false;

    Animated.timing(opacity, {
      toValue: 1,
      duration: INITIAL_FADE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      if (!hasSignaledRef.current) {
        hasSignaledRef.current = true;
        onReady?.();
      }
    });
  }, [opacity, onReady, source]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backgroundLayer, { opacity }]}>
        <ImageBackground
          source={source}
          style={styles.image}
          resizeMode="cover"
          blurRadius={blurRadius}
        />
      </Animated.View>

      <View
        style={[
          styles.overlay,
          { backgroundColor: overlayColor ?? 'rgba(0,0,0,0.3)' },
        ]}
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
};