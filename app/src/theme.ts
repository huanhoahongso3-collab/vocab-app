import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useColorScheme } from 'react-native';

/** Corner radius used for cards, inputs and dialogs: the large, soft shapes of Material 3 Expressive. */
export const BIG = 28;

/**
 * Material 3 theme. On Android 12+ colors come from the user's wallpaper (Material You);
 * elsewhere they are generated from the fallback seed. Expressive traits (large shapes, bold type,
 * tonal surfaces) are applied via these tokens and per-component styles.
 */
export function useAppTheme(): MD3Theme {
  const scheme = useColorScheme();
  const { theme } = useMaterial3Theme({ fallbackSourceColor: '#5B5BD6' });
  const base = scheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const colors = scheme === 'dark' ? theme.dark : theme.light;
  return {
    ...base,
    roundness: 6,
    colors: { ...base.colors, ...colors },
    fonts: {
      ...base.fonts,
      headlineMedium: { ...base.fonts.headlineMedium, fontWeight: '800', letterSpacing: -0.5 },
      headlineSmall: { ...base.fonts.headlineSmall, fontWeight: '800' },
      titleMedium: { ...base.fonts.titleMedium, fontWeight: '700' },
      titleLarge: { ...base.fonts.titleLarge, fontWeight: '800' },
    },
  };
}
