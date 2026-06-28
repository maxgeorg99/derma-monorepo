import '../global.css';

import { Platform } from 'react-native';

// Wise-inspired brand palette — DESIGN.md
export const BrandColors = {
  primary: '#9fe870',
  onPrimary: '#0e0f0c',
  primaryActive: '#cdffad',
  primaryNeutral: '#c5edab',
  primaryPale: '#e2f6d5',
  ink: '#0e0f0c',
  inkDeep: '#163300',
  body: '#454745',
  mute: '#868685',
  canvas: '#ffffff',
  canvasSoft: '#e8ebe6',
  positive: '#2ead4b',
  positiveDeep: '#054d28',
  warning: '#ffd11a',
  warningDeep: '#b86700',
  warningContent: '#4a3b1c',
  negative: '#d03238',
  negativeDeep: '#a72027',
  negativeDarkest: '#a7000d',
  negativeBg: '#320707',
  accentOrange: '#ffc091',
  accentCyan: '#38c8ff',
} as const;

// Themed color map — kept for backward compatibility with ThemedText/ThemedView
export const Colors = {
  light: {
    text: BrandColors.ink,
    background: BrandColors.canvas,
    backgroundElement: BrandColors.canvasSoft,
    backgroundSelected: BrandColors.primaryNeutral,
    textSecondary: BrandColors.body,
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// Border radius scale — DESIGN.md rounded tokens
export const Radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
  full: 9999,
} as const;

// Spacing scale — DESIGN.md spacing tokens (base unit: 4px)
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xl2: 32,
  xl3: 48,
  // Legacy numeric aliases used by existing components
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
