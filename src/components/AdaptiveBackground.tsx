import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  View,
} from 'react-native';

import { BackgroundConfig } from '../constants/backgrounds';

type AdaptiveBackgroundProps = PropsWithChildren<{
  onReady?: () => void;
  overlayColor?: string;
  blurRadius?: number;
  backgroundMode?: 'auto' | 'user';
  userBackgroundUri?: string | null;
  background?: BackgroundConfig | null;
}>;

const TRANSITION_DURATION = 420;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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

const isSameSource = (
  a: number | { uri: string } | null,
  b: number | { uri: string } | null,
): boolean => {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a === b;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return a.uri === b.uri;
  }

  return false;
};

export const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({
  children,
  onReady,
  overlayColor,
  blurRadius = 0,
  backgroundMode = 'auto',
  userBackgroundUri,
  background,
}) => {
  const fadeA = useRef(new Animated.Value(1)).current;
  const fadeB = useRef(new Animated.Value(0)).current;
  const hasMountedRef = useRef(false);
  const activeLayerRef = useRef<'A' | 'B'>('A');

  const targetSource = useMemo(() => {
    if (backgroundMode === 'user' && userBackgroundUri) {
      return { uri: userBackgroundUri };
    }

    return background?.portrait ?? null;
  }, [background, backgroundMode, userBackgroundUri]);

  const [sourceA, setSourceA] = useState<number | { uri: string } | null>(targetSource);
  const [sourceB, setSourceB] = useState<number | { uri: string } | null>(null);

  useEffect(() => {
    if (!targetSource) {
      return;
    }

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setSourceA(targetSource);
      setSourceB(null);
      fadeA.setValue(1);
      fadeB.setValue(0);
      activeLayerRef.current = 'A';
      onReady?.();
      return;
    }

    const activeSource = activeLayerRef.current === 'A' ? sourceA : sourceB;

    if (isSameSource(activeSource, targetSource)) {
      onReady?.();
      return;
    }

    if (activeLayerRef.current === 'A') {
      setSourceB(targetSource);
      fadeB.setValue(0);

      Animated.parallel([
        Animated.timing(fadeB, {
          toValue: 1,
          duration: TRANSITION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(fadeA, {
          toValue: 0,
          duration: TRANSITION_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        activeLayerRef.current = 'B';
        onReady?.();
      });

      return;
    }

    setSourceA(targetSource);
    fadeA.setValue(0);

    Animated.parallel([
      Animated.timing(fadeA, {
        toValue: 1,
        duration: TRANSITION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(fadeB, {
        toValue: 0,
        duration: TRANSITION_DURATION,
        useNativeDriver: true,
      }),
    ]).start(() => {
      activeLayerRef.current = 'A';
      onReady?.();
    });
  }, [fadeA, fadeB, onReady, sourceA, sourceB, targetSource]);

  return (
    <View style={styles.container}>
      {sourceA ? (
        <Animated.View style={[styles.backgroundLayer, { opacity: fadeA }]}>
          <ImageBackground
            source={sourceA}
            style={styles.image}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
        </Animated.View>
      ) : null}

      {sourceB ? (
        <Animated.View style={[styles.backgroundLayer, { opacity: fadeB }]}>
          <ImageBackground
            source={sourceB}
            style={styles.image}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
        </Animated.View>
      ) : null}

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