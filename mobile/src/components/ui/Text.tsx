import React from 'react';
import { Text as RNText, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  weight?: 'normal' | 'bold' | 'semibold' | 'medium';
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align,
  weight,
  style,
  children,
  ...props
}) => {
  const getVariantStyle = (variant: TextVariant) => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: SIZES.xxxl,
          ...FONTS.bold,
        };
      case 'h2':
        return {
          fontSize: SIZES.xxl,
          ...FONTS.bold,
        };
      case 'h3':
        return {
          fontSize: SIZES.xl,
          ...FONTS.semiBold,
        };
      case 'h4':
        return {
          fontSize: SIZES.lg,
          ...FONTS.semiBold,
        };
      case 'body':
        return {
          fontSize: SIZES.md,
          ...FONTS.regular,
        };
      case 'body-sm':
        return {
          fontSize: SIZES.sm,
          ...FONTS.regular,
        };
      case 'caption':
        return {
          fontSize: SIZES.xs,
          ...FONTS.regular,
        };
      case 'label':
        return {
          fontSize: SIZES.sm,
          ...FONTS.medium,
        };
      default:
        return {
          fontSize: SIZES.md,
          ...FONTS.regular,
        };
    }
  };

  const getWeightStyle = (weight?: string) => {
    if (!weight) return {};

    switch (weight) {
      case 'bold':
        return FONTS.bold;
      case 'semibold':
        return FONTS.semiBold;
      case 'medium':
        return FONTS.medium;
      case 'normal':
      default:
        return FONTS.regular;
    }
  };

  const variantStyle = getVariantStyle(variant);
  const weightStyle = getWeightStyle(weight);
  const colorStyle = color ? { color } : { color: COLORS.text };
  const alignStyle = align ? { textAlign: align } : {};

  return (
    <RNText
      style={[
        variantStyle,
        weightStyle,
        colorStyle,
        alignStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Text;