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

type BackgroundSource = number | { uri: string } | null;

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

const isSameSource = (a: BackgroundSource, b: BackgroundSource): boolean => {
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
  const fadeIncoming = useRef(new Animated.Value(0)).current;
  const transitionRunningRef = useRef(false);
  const pendingTargetRef = useRef<BackgroundSource>(null);
  const displayedSourceRef = useRef<BackgroundSource>(null);

  const targetSource = useMemo<BackgroundSource>(() => {
    if (backgroundMode === 'user' && userBackgroundUri) {
      return { uri: userBackgroundUri };
    }

    return background?.portrait ?? null;
  }, [background, backgroundMode, userBackgroundUri]);

  const [displayedSource, setDisplayedSource] = useState<BackgroundSource>(targetSource);
  const [incomingSource, setIncomingSource] = useState<BackgroundSource>(null);

  useEffect(() => {
    displayedSourceRef.current = displayedSource;
  }, [displayedSource]);

  useEffect(() => {
    if (!targetSource) {
      return;
    }

    // 첫 진입
    if (!displayedSourceRef.current) {
      displayedSourceRef.current = targetSource;
      setDisplayedSource(targetSource);
      setIncomingSource(null);
      fadeIncoming.setValue(0);
      onReady?.();
      return;
    }

    // 현재 표시 중인 배경과 같으면 전환 불필요
    if (isSameSource(displayedSourceRef.current, targetSource)) {
      pendingTargetRef.current = null;
      onReady?.();
      return;
    }

    // 이미 전환 중이면 마지막 요청만 기억
    if (transitionRunningRef.current) {
      pendingTargetRef.current = targetSource;
      return;
    }

    transitionRunningRef.current = true;
    pendingTargetRef.current = null;
    setIncomingSource(targetSource);
    fadeIncoming.setValue(0);

    Animated.timing(fadeIncoming, {
      toValue: 1,
      duration: TRANSITION_DURATION,
      useNativeDriver: true,
    }).start(() => {
      displayedSourceRef.current = targetSource;
      setDisplayedSource(targetSource);
      setIncomingSource(null);
      fadeIncoming.setValue(0);
      transitionRunningRef.current = false;
      onReady?.();

      const pendingTarget = pendingTargetRef.current;
      if (pendingTarget && !isSameSource(displayedSourceRef.current, pendingTarget)) {
        pendingTargetRef.current = null;
        transitionRunningRef.current = true;
        setIncomingSource(pendingTarget);
        fadeIncoming.setValue(0);

        Animated.timing(fadeIncoming, {
          toValue: 1,
          duration: TRANSITION_DURATION,
          useNativeDriver: true,
        }).start(() => {
          displayedSourceRef.current = pendingTarget;
          setDisplayedSource(pendingTarget);
          setIncomingSource(null);
          fadeIncoming.setValue(0);
          transitionRunningRef.current = false;
          onReady?.();
        });
      }
    });
  }, [fadeIncoming, onReady, targetSource]);

  return (
    <View style={styles.container}>
      {displayedSource ? (
        <View style={styles.backgroundLayer}>
          <ImageBackground
            source={displayedSource}
            style={styles.image}
            resizeMode="cover"
            blurRadius={blurRadius}
          />
        </View>
      ) : null}

      {incomingSource ? (
        <Animated.View style={[styles.backgroundLayer, { opacity: fadeIncoming }]}>
          <ImageBackground
            source={incomingSource}
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