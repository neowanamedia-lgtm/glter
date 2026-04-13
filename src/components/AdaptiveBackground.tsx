import React, { PropsWithChildren, useMemo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

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
});

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

  return (
    <View style={styles.container}>
      {targetSource ? (
        <View style={styles.backgroundLayer}>
          <ImageBackground
            key={backgroundKey}
            source={targetSource}
            style={styles.image}
            resizeMode="cover"
            blurRadius={blurRadius}
            onLoadEnd={() => onReady?.(backgroundKey)}
          />
        </View>
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