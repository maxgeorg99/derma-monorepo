import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { BrandColors, Radius, Spacing } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
type ButtonSize = 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function getLabelColor(variant: ButtonVariant): string {
  if (variant === 'primary') return BrandColors.onPrimary;
  return BrandColors.ink;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'tertiary' && styles.tertiary,
        size === 'lg' && styles.sizeLg,
        fullWidth && styles.fullWidth,
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
      {...props}>
      <Text style={[styles.label, { color: getLabelColor(variant) }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sizeLg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl2,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: BrandColors.primary,
  },
  secondary: {
    backgroundColor: BrandColors.canvasSoft,
  },
  tertiary: {
    backgroundColor: BrandColors.canvas,
    borderWidth: 1,
    borderColor: BrandColors.ink,
  },
  dimmed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
