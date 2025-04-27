import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  style,
  ...props
}) => {
  // Estilo do botão com base na variante
  const getButtonVariantStyle = (variant: ButtonVariant) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        };
      case 'secondary':
        return {
          backgroundColor: COLORS.secondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: COLORS.transparent,
          borderWidth: 1,
          borderColor: COLORS.primary,
        };
      case 'ghost':
        return {
          backgroundColor: COLORS.transparent,
          borderWidth: 0,
        };
      case 'destructive':
        return {
          backgroundColor: COLORS.error,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          borderWidth: 0,
        };
    }
  };

  // Estilo do texto do botão com base na variante
  const getTextVariantStyle = (variant: ButtonVariant) => {
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
        return {
          color: COLORS.white,
        };
      case 'outline':
      case 'ghost':
        return {
          color: COLORS.primary,
        };
      default:
        return {
          color: COLORS.white,
        };
    }
  };

  // Estilo do botão com base no tamanho
  const getButtonSizeStyle = (size: ButtonSize) => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: SIZES.spacing.xs,
          paddingHorizontal: SIZES.spacing.md,
        };
      case 'md':
        return {
          paddingVertical: SIZES.spacing.sm,
          paddingHorizontal: SIZES.spacing.lg,
        };
      case 'lg':
        return {
          paddingVertical: SIZES.spacing.md,
          paddingHorizontal: SIZES.spacing.xl,
        };
      default:
        return {
          paddingVertical: SIZES.spacing.sm,
          paddingHorizontal: SIZES.spacing.lg,
        };
    }
  };

  // Estilo do texto do botão com base no tamanho
  const getTextSizeStyle = (size: ButtonSize) => {
    switch (size) {
      case 'sm':
        return {
          fontSize: SIZES.sm,
        };
      case 'md':
        return {
          fontSize: SIZES.md,
        };
      case 'lg':
        return {
          fontSize: SIZES.lg,
        };
      default:
        return {
          fontSize: SIZES.md,
        };
    }
  };

  const buttonVariantStyle = getButtonVariantStyle(variant);
  const textVariantStyle = getTextVariantStyle(variant);
  const buttonSizeStyle = getButtonSizeStyle(size);
  const textSizeStyle = getTextSizeStyle(size);
  
  const buttonStyles = [
    styles.button,
    buttonVariantStyle,
    buttonSizeStyle,
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];
  
  const textStyles = [
    styles.text,
    textVariantStyle,
    textSizeStyle,
    disabled && styles.disabledText,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
    ...FONTS.medium,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: SIZES.spacing.xs,
  },
  iconRight: {
    marginLeft: SIZES.spacing.xs,
  },
});

export default Button;