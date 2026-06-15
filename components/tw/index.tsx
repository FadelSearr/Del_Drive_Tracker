import { Link as RouterLink } from "expo-router";
import React from "react";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TouchableHighlight as RNTouchableHighlight,
  TextInput as RNTextInput,
  StyleSheet,
} from "react-native";
import { Image as RNImage } from "expo-image";

// NativeWind v4: className props work directly on components without useCssElement
// Just re-export native components — NativeWind babel transform handles className

export const Link = RouterLink;

// CSS Variable hook (simplified for NativeWind v4)
export const useCSSVariable = (variable: string) => {
  // In NativeWind v4, CSS variables are handled via theme config
  // Return the variable name for web compatibility
  return `var(${variable})`;
};

// View
export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};
export const View = RNView;

// Text
export const Text = RNText;

// ScrollView
export const ScrollView = RNScrollView;

// Pressable
export const Pressable = RNPressable;

// TextInput
export const TextInput = RNTextInput;

// AnimatedScrollView (non-animated since Reanimated removed)
export const AnimatedScrollView = RNScrollView;

const AnimatedExpoImage = RNImage;

function CSSImage(props: any) {
  const { objectFit, objectPosition, ...style } =
    StyleSheet.flatten(props.style) || {};

  return (
    <AnimatedExpoImage
      contentFit={objectFit as any}
      contentPosition={objectPosition as any}
      {...(props as any)}
      source={
        typeof props.source === "string" ? { uri: props.source } : props.source
      }
      style={style as any}
    />
  );
}

export const Image = CSSImage;

// TouchableHighlight
export const TouchableHighlight = RNTouchableHighlight;
