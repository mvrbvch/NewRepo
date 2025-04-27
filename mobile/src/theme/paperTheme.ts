import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import { COLORS, FONTS } from '../constants/theme';

// Configuração de fontes para React Native Paper
const fontConfig = {
  regular: {
    fontFamily: 'System',
    fontWeight: 'normal',
  },
  medium: {
    fontFamily: 'System',
    fontWeight: '500',
  },
  light: {
    fontFamily: 'System',
    fontWeight: '300',
  },
  thin: {
    fontFamily: 'System',
    fontWeight: '100',
  },
};

// Criar tema para React Native Paper baseado em nossas cores
export const paperTheme = {
  ...DefaultTheme,
  // Customizar cores de acordo com nossa paleta
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    primaryContainer: COLORS.primaryLight,
    onPrimaryContainer: COLORS.white,
    secondary: COLORS.secondary,
    onSecondary: COLORS.white,
    secondaryContainer: COLORS.gray200,
    onSecondaryContainer: COLORS.gray700,
    tertiary: COLORS.warning,
    onTertiary: COLORS.white,
    tertiaryContainer: '#FFE0B2', // Tom claro de laranja
    onTertiaryContainer: '#5D4037', // Marrom escuro
    error: COLORS.error,
    errorContainer: '#FFEBEE', // Rosa claro
    onErrorContainer: '#B71C1C', // Vermelho escuro
    background: COLORS.background,
    onBackground: COLORS.text,
    surface: COLORS.white,
    onSurface: COLORS.text,
    surfaceVariant: COLORS.gray100,
    onSurfaceVariant: COLORS.gray700,
    outline: COLORS.gray300,
    outlineVariant: COLORS.gray200,
    elevation: {
      level0: 'transparent',
      level1: COLORS.white, // Cartões, superfícies elevadas
      level2: COLORS.white, // Botões elevados, cartões destacados
      level3: COLORS.white, // Menus de navegação
      level4: COLORS.white, // Diálogos
      level5: COLORS.white, // Bottom sheets
    },
    // Cores personalizadas adicionais disponíveis no aplicativo
    success: COLORS.success,
    info: COLORS.info,
    warning: COLORS.warning,
    textLight: COLORS.textLight,
    textSecondary: COLORS.textSecondary,
  },
  // Configurar fontes
  fonts: configureFonts({ config: fontConfig }),
  // Customizar arredondamento de bordas
  roundness: 8,
};

export default paperTheme;