import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Button,
  TextInput,
  Text,
  Title,
  Headline,
  useTheme,
} from "react-native-paper";

// Hooks
import { useAuth } from "../hooks/useAuth";

// Constantes
import { COLORS } from "../constants/theme";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation();
  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      // TODO: Mostrar mensagem de erro
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // A navegação será tratada pelo hook useAuth
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      // TODO: Mostrar mensagem de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Title style={styles.title}>NÓS JUNTOS</Title>
            <Headline style={styles.subtitle}>
              Bem-vindo ao aplicativo para casais!
            </Headline>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.message}>
              Faça login para acessar sua conta e continuar sua jornada com seu
              parceiro.
            </Text>

            <TextInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              outlineStyle={{ borderRadius: 8 }}
              theme={{ colors: { primary: theme.colors.primary } }}
            />

            <TextInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureTextEntry}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? "eye" : "eye-off"}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
              outlineStyle={{ borderRadius: 8 }}
              theme={{ colors: { primary: theme.colors.primary } }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              labelStyle={styles.buttonLabel}
            >
              ENTRAR
            </Button>

            <Button
              mode="text"
              onPress={() => {
                /* Navegação para tela de senha esquecida */
              }}
              style={styles.forgotPasswordButton}
              labelStyle={{ color: theme.colors.primary }}
            >
              Esqueci minha senha
            </Button>

            <View style={styles.registerContainer}>
              <Text style={{ color: COLORS.textSecondary }}>
                Não tem uma conta?
              </Text>
              <Button
                mode="text"
                onPress={() => {
                  /* Navegação para tela de registro */
                }}
                style={{ marginLeft: -8 }}
                labelStyle={{ color: theme.colors.primary }}
              >
                Cadastre-se
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontWeight: "bold",
    fontSize: 24,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  formContainer: {
    marginTop: 20,
  },
  message: {
    marginBottom: 24,
    textAlign: "center",
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  input: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  loginButton: {
    marginTop: 8,
    padding: 6,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  forgotPasswordButton: {
    marginTop: 8,
  },
  registerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});

export default LoginScreen;
