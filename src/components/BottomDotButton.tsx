import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

export type BottomDotButtonProps = {
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const BREATH_DURATION = 3200;
const PRESS_SCALE = 0.84;
const BREATH_OPACITY_RANGE: [number, number] = [0.25, 0.98];
const BREATH_SCALE_RANGE: [number, number] = [0.94, 1.02];

export const BottomDotButton: React.FC<BottomDotButtonProps> = ({
  onPress,
  style,
  accessibilityLabel,
}) => {
  const breathAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: BREATH_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: BREATH_DURATION,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [breathAnim]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: PRESS_SCALE,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
    ]).start();
  };

  const breathOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: BREATH_OPACITY_RANGE,
  });

  const breathScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: BREATH_SCALE_RANGE,
  });

  const animatedStyle = {
    opacity: breathOpacity,
    transform: [{ scale: Animated.multiply(scaleAnim, breathScale) }],
  };

  return (
    <Pressable
      style={[styles.touchArea, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.dot, animatedStyle]} />
    </Pressable>
  );
};

const DOT_SIZE = 12;

const styles = StyleSheet.create({
  touchArea: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#ffffff',
  },
});