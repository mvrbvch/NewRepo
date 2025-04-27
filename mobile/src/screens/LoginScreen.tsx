import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard,
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { Text, Input, Button } from '../components/ui';
import { COLORS, SIZES } from '../constants/theme';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Implementação do login
    setIsLoading(true);
    try {
      // Aqui chamaria o serviço de autenticação
      setTimeout(() => {
        setIsLoading(false);
        // Navegar para a tela principal após login
        // navigation.navigate('Home');
      }, 1500);
    } catch (error) {
      setIsLoading(false);
      console.error('Erro ao fazer login:', error);
    }
  };

  const handleRegister = () => {
    // Navegar para a tela de cadastro
    // navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text variant="h1" color={COLORS.primary} style={styles.logoText}>
                NÓS
              </Text>
              <Text variant="h3" color={COLORS.gray700} style={styles.subLogoText}>
                JUNTOS
              </Text>
            </View>

            <Text
              variant="body"
              color={COLORS.textSecondary}
              align="center"
              style={styles.description}
            >
              Cada dia é uma nova oportunidade de nos escolhermos — mesmo nas pequenas tarefas do cotidiano. Vamos juntos transformar a rotina em uma jornada de crescimento e amor.
            </Text>

            <View style={styles.formContainer}>
              <Input
                placeholder="Email ou Nome de Usuário"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Input
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.passwordInput}
              />

              <Button
                title="Entrar"
                variant="primary"
                loading={isLoading}
                onPress={handleLogin}
                style={styles.loginButton}
              />

              <View style={styles.registerContainer}>
                <TouchableOpacity onPress={handleRegister}>
                  <Text
                    variant="body"
                    color={COLORS.gray600}
                    align="center"
                  >
                    Cadastrar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  inner: {
    flex: 1,
    padding: SIZES.spacing.md,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: SIZES.spacing.xs,
  },
  logoText: {
    marginTop: SIZES.spacing.xs,
  },
  subLogoText: {
    marginTop: -5,
  },
  description: {
    marginBottom: SIZES.spacing.xl,
    paddingHorizontal: SIZES.spacing.md,
  },
  formContainer: {
    marginTop: SIZES.spacing.md,
  },
  passwordInput: {
    marginTop: SIZES.spacing.md,
  },
  loginButton: {
    marginTop: SIZES.spacing.lg,
    height: SIZES.buttonHeight,
  },
  registerContainer: {
    marginTop: SIZES.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default LoginScreen;