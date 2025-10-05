import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

type Props = {
  delay?: number;
  duration?: number;
  distance?: number;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
};

const FadeInUp: React.FC<Props> = ({ delay = 0, duration = 300, distance = 16, style, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

export default FadeInUp;
