import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Font from 'expo-font';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';

// Navegação
import AppNavigator from './src/navigation/AppNavigator';

// Temas
import { COLORS } from './src/constants/theme';
import paperTheme from './src/theme/paperTheme';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  // Função para carregar recursos iniciais, como fontes
  async function prepare() {
    try {
      // Aqui podemos incluir o carregamento de fontes, imagens e outros recursos
      // Por exemplo:
      // await Font.loadAsync({
      //   'roboto-regular': require('./assets/fonts/Roboto-Regular.ttf'),
      //   'roboto-medium': require('./assets/fonts/Roboto-Medium.ttf'),
      //   'roboto-bold': require('./assets/fonts/Roboto-Bold.ttf'),
      // });
      
      // Simulando um carregamento para este exemplo
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      console.warn('Erro ao carregar recursos iniciais:', e);
    } finally {
      // Quando todos os recursos estiverem carregados, atualizamos o estado
      setIsReady(true);
    }
  }

  useEffect(() => {
    prepare();
  }, []);

  // Exibimos um loading enquanto os recursos não estão prontos
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});