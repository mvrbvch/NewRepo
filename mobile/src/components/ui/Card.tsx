import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../constants/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: boolean | number;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = true,
  style,
  ...props
}) => {
  // Estilo do card com base na variante
  const getCardVariantStyle = (variant: string): StyleProp<ViewStyle> => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: COLORS.white,
          borderWidth: 1,
          borderColor: COLORS.border,
          ...SHADOWS.small,
        };
      case 'elevated':
        return {
          backgroundColor: COLORS.white,
          borderWidth: 0,
          ...SHADOWS.medium,
        };
      case 'default':
      default:
        return {
          backgroundColor: COLORS.white,
          borderWidth: 0,
          ...SHADOWS.small,
        };
    }
  };

  // Estilo de padding com base no parâmetro
  const getPaddingStyle = (padding: boolean | number): StyleProp<ViewStyle> => {
    if (typeof padding === 'number') {
      return { padding };
    } else if (padding) {
      return { padding: SIZES.spacing.md };
    }
    return {};
  };

  const cardVariantStyle = getCardVariantStyle(variant);
  const paddingStyle = getPaddingStyle(padding);

  return (
    <View 
      style={[styles.card, cardVariantStyle, paddingStyle, style]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius.md,
    overflow: 'hidden',
  },
});

export default Card;