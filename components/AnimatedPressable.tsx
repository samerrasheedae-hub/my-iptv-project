import * as Haptics from 'expo-haptics';
import { PropsWithChildren, useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

type Props = PropsWithChildren<PressableProps & { style?: StyleProp<ViewStyle>; haptics?: boolean }>;

export function AnimatedPressable({ children, style, haptics = true, onPress, ...props }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, friction: 7, tension: 130 }).start();
  };

  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        animate(0.96);
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        props.onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptics) Haptics.selectionAsync();
        onPress?.(event);
      }}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
