import { StyleSheet, View, type ViewProps } from 'react-native';

import { BrandColors, Radius, Spacing } from '../../constants/theme';

type CardVariant = 'content' | 'sage' | 'green' | 'dark';

interface CardProps extends ViewProps {
  variant?: CardVariant;
}

export function Card({ variant = 'content', style, ...props }: CardProps) {
  return <View style={[styles.base, styles[variant], style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  content: {
    backgroundColor: BrandColors.canvas,
  },
  sage: {
    backgroundColor: BrandColors.canvasSoft,
  },
  green: {
    backgroundColor: BrandColors.primaryPale,
  },
  dark: {
    backgroundColor: BrandColors.ink,
  },
});
