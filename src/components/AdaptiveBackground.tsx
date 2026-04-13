import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageBackground, StyleSheet, View } from 'react-native';

import { BackgroundConfig } from '../constants/backgrounds';

type AdaptiveBackgroundProps = PropsWithChildren<{
  onReady?: (backgroundKey?: string) => void;
  overlayColor?: string;
  blurRadius?: number;
  backgroundMode?: 'auto' | 'user';
  userBackgroundUri?: string | null;
  background?: BackgroundConfig | null;
  backgroundKey?: string;
}>;

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
  hiddenPreload: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: -9999,
    top: -9999,
  },
});

const resolveSourceKey = (source: BackgroundSource): string => {
  if (!source) return 'none';
  if (typeof source === 'number') return `asset:${source}`;
  return `uri:${source.uri}`;
};

const isSameSource = (a: BackgroundSource, b: BackgroundSource): boolean => {
  return resolveSourceKey(a) === resolveSourceKey(b);
};

export const AdaptiveBackground: React.FC<AdaptiveBackgroundProps> = ({
  children,
  onReady,
  overlayColor,
  blurRadius = 0,
  backgroundMode = 'auto',
  userBackgroundUri,
  background,
  backgroundKey,
}) => {
  const targetSource: BackgroundSource = useMemo(() => {
    if (backgroundMode === 'user' && userBackgroundUri) {
      return { uri: userBackgroundUri };
    }
    return background?.portrait ?? null;
  }, [background, backgroundMode, userBackgroundUri]);

  const targetSourceKey = useMemo(() => resolveSourceKey(targetSource), [targetSource]);
  const resolvedTargetKey = backgroundKey ?? targetSourceKey;

  const [currentSource, setCurrentSource] = useState<BackgroundSource>(targetSource);
  const [currentSourceKey, setCurrentSourceKey] = useState<string>(targetSourceKey);

  const [preloadSource, setPreloadSource] = useState<BackgroundSource>(null);
  const [preloadSourceKey, setPreloadSourceKey] = useState<string>('');

  const notifiedKeyRef = useRef<string>('');

  const notifyReady = (key: string) => {
    if (!key) {
      return;
    }
    if (notifiedKeyRef.current === key) {
      return;
    }
    notifiedKeyRef.current = key;
    onReady?.(key);
  };

  useEffect(() => {
    if (!targetSource) {
      setCurrentSource(null);
      setCurrentSourceKey('none');
      setPreloadSource(null);
      setPreloadSourceKey('');
      notifiedKeyRef.current = '';
      return;
    }

    if (isSameSource(currentSource, targetSource)) {
      setPreloadSource(null);
      setPreloadSourceKey('');
      notifyReady(resolvedTargetKey);
      return;
    }

    setPreloadSource(targetSource);
    setPreloadSourceKey(resolvedTargetKey);
  }, [currentSource, resolvedTargetKey, targetSource]);

  const commitPreloadedBackground = () => {
    if (!preloadSource || !preloadSourceKey) {
      return;
    }

    setCurrentSource(preloadSource);
    setCurrentSourceKey(resolveSourceKey(preloadSource));
    setPreloadSource(null);
    setPreloadSourceKey('');
    notifyReady(preloadSourceKey);
  };

  useEffect(() => {
    if (!currentSource && !targetSource) {
      return;
    }

    if (currentSource && isSameSource(currentSource, targetSource)) {
      notifyReady(resolvedTargetKey);
    }
  }, [currentSource, resolvedTargetKey, targetSource]);

  return (
    <View style={styles.container}>
      {currentSource ? (
        <View style={styles.backgroundLayer}>
          <ImageBackground
            source={currentSource}
            style={styles.image}
            resizeMode="cover"
            blurRadius={blurRadius}
            fadeDuration={0}
          />
        </View>
      ) : null}

      {preloadSource ? (
        <Image
          source={preloadSource}
          style={styles.hiddenPreload}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={commitPreloadedBackground}
          onLoadEnd={commitPreloadedBackground}
          onError={() => {
            setCurrentSource(preloadSource);
            setCurrentSourceKey(resolveSourceKey(preloadSource));
            setPreloadSource(null);
            setPreloadSourceKey('');
            notifyReady(preloadSourceKey || resolvedTargetKey);
          }}
        />
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