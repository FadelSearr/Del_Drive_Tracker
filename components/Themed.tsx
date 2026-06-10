/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'] & {
  type?: 'default' | 'muted' | 'primary' | 'danger' | 'warning' | 'success';
};
export type ViewProps = ThemeProps & DefaultView['props'] & {
  type?: 'background' | 'surface' | 'border';
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme === 'dark' ? 'dark' : 'light'];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme === 'dark' ? 'dark' : 'light'][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, type = 'default', ...otherProps } = props;
  
  let colorName: keyof typeof Colors.light & keyof typeof Colors.dark = 'text';
  if (type === 'muted') colorName = 'textMuted';
  if (type === 'primary') colorName = 'primary';
  if (type === 'danger') colorName = 'danger';
  if (type === 'warning') colorName = 'warning';
  if (type === 'success') colorName = 'success';

  const color = useThemeColor({ light: lightColor, dark: darkColor }, colorName);

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, type = 'background', ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, type);

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
