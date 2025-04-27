// Tema consistente com o PWA
export const COLORS = {
  primary: '#4F46E5', // Cor principal - indigo
  primaryDark: '#4338CA',
  primaryLight: '#6366F1',
  
  secondary: '#8B5CF6', // Violeta
  
  success: '#10B981', // Verde
  warning: '#F59E0B', // Amarelo
  error: '#EF4444',   // Vermelho
  info: '#3B82F6',    // Azul
  
  white: '#FFFFFF',
  black: '#000000',
  
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#888888',
  border: '#E5E7EB',
  
  transparent: 'transparent',
};

export const FONTS = {
  regular: {
    fontFamily: 'System', // No React Native usamos as fontes do sistema por padrão
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  semiBold: {
    fontFamily: 'System',
    fontWeight: '600',
  },
  bold: {
    fontFamily: 'System',
    fontWeight: 'bold',
  },
};

export const SIZES = {
  // Tamanhos de fonte
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  
  // Espaçamento
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Raio das bordas
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  // Tamanhos de header
  header: 60,
  
  // Alturas para componentes específicos
  buttonHeight: 48,
  inputHeight: 48,
  
  // Largura e altura da tela
  width: '100%',
  height: '100%',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
};

const appTheme = { COLORS, FONTS, SIZES, SHADOWS };

export default appTheme;