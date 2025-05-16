import { useState, useCallback } from "react";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import { useAuth } from "./use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "./use-toast";
import { useEffect } from "react";

export function useBiometricAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Verificar suporte de biometria ao carregar o hook

  useEffect(() => {
    // Verificar se o navegador suporta WebAuthn
    const checkSupport = async () => {
      try {
        // Verifica se o PublicKeyCredential está disponível
        if (
          window.PublicKeyCredential &&
          window.PublicKeyCredential
            .isUserVerifyingPlatformAuthenticatorAvailable
        ) {
          const available =
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } else {
          setIsSupported(false);
        }
      } catch (error) {
        console.error("Erro ao verificar suporte biométrico:", error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Buscar opções de registro
  const registerOptionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/webauthn/register-options"
      );
      return await response.json();
    },
  });

  // Verificar resposta de registro
  const registerVerifyMutation = useMutation({
    mutationFn: async ({
      credential,
      deviceName,
    }: {
      credential: any;
      deviceName: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/webauthn/register-verify",
        {
          credential,
          deviceName,
        }
      );
      return await response.json();
    },
  });

  // Buscar opções de login
  const loginOptionsMutation = useMutation({
    mutationFn: async (username: string) => {
      const response = await apiRequest("POST", "/api/webauthn/login-options", {
        username,
      });
      return await response.json();
    },
  });

  // Verificar resposta de login
  const loginVerifyMutation = useMutation({
    mutationFn: async ({
      credential,
      userId,
    }: {
      credential: any;
      userId: number;
    }) => {
      const response = await apiRequest("POST", "/api/webauthn/login-verify", {
        credential,
        userId,
      });
      return await response.json();
    },
  });

  // Buscar credenciais registradas
  const credentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/webauthn/credentials");
      return await response.json();
    },
  });

  // Remover uma credencial
  const removeCredentialMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/webauthn/credentials/${credentialId}`
      );
      return await response.json();
    },
  });

  // Registrar nova credencial biométrica
  const registerBiometric = useCallback(
    async (deviceName: string) => {
      try {
        // Verifica se o usuário está autenticado
        if (!user) {
          toast({
            title: "Erro",
            description: "Você precisa estar logado para registrar biometria",
            variant: "destructive",
          });
          return { success: false };
        }

        // Verifica se o dispositivo é compatível
        if (!isSupported) {
          toast({
            title: "Dispositivo não compatível",
            description: "Seu dispositivo não suporta autenticação biométrica",
            variant: "destructive",
          });
          return { success: false };
        }

        // 1. Obter opções de registro do servidor
        const optionsResult = await registerOptionsMutation.mutateAsync();

        // 2. Iniciar o registro biométrico no dispositivo
        const attResp = await startRegistration(optionsResult);

        // 3. Enviar a resposta para o servidor para verificação
        const verificationResult = await registerVerifyMutation.mutateAsync({
          credential: attResp,
          deviceName: deviceName || "Meu dispositivo",
        });

        if (verificationResult.verified) {
          toast({
            title: "Biometria registrada",
            description: "Seu dispositivo foi registrado com sucesso",
            variant: "default",
          });
          return { success: true, credential: verificationResult.credential };
        } else {
          toast({
            title: "Falha no registro",
            description: "Não foi possível registrar seu dispositivo",
            variant: "destructive",
          });
          return { success: false };
        }
      } catch (error) {
        console.error("Erro ao registrar biometria:", error);
        let errorMessage = "Ocorreu um erro ao registrar biometria";

        // Tratar erros específicos
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            errorMessage = "Permissão negada para acessar biometria";
          } else if (error.name === "NotSupportedError") {
            errorMessage =
              "Seu dispositivo não suporta este tipo de autenticação";
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error };
      }
    },
    [user, isSupported, registerOptionsMutation, registerVerifyMutation, toast]
  );

  // Login com biometria
  const loginWithBiometric = useCallback(
    async (username: string) => {
      try {
        // Verificar suporte
        if (!isSupported) {
          toast({
            title: "Dispositivo não compatível",
            description: "Seu dispositivo não suporta autenticação biométrica",
            variant: "destructive",
          });
          return { success: false };
        }

        // 1. Obter opções de autenticação do servidor
        const optionsResult = await loginOptionsMutation.mutateAsync(username);

        if (!optionsResult || !optionsResult.options) {
          toast({
            title: "Erro",
            description: "Não foi possível iniciar autenticação biométrica",
            variant: "destructive",
          });
          return { success: false };
        }

        // 2. Iniciar autenticação biométrica no dispositivo
        const authResp = await startAuthentication(optionsResult.options);

        // 3. Enviar a resposta para o servidor para verificação
        const verificationResult = await loginVerifyMutation.mutateAsync({
          credential: authResp,
          userId: optionsResult.userId,
        });

        if (verificationResult.success) {
          toast({
            title: "Login realizado",
            description: "Você foi autenticado com biometria",
            variant: "default",
          });
          return { success: true, user: verificationResult.user };
        } else {
          toast({
            title: "Falha na autenticação",
            description: "Não foi possível autenticar com biometria",
            variant: "destructive",
          });
          return { success: false };
        }
      } catch (error) {
        console.error("Erro ao fazer login com biometria:", error);
        let errorMessage = "Ocorreu um erro ao autenticar com biometria";

        // Tratar erros específicos
        if (error instanceof Error) {
          if (error.name === "NotAllowedError") {
            errorMessage = "Permissão negada para acessar biometria";
          } else if (error.name === "NotSupportedError") {
            errorMessage =
              "Seu dispositivo não suporta este tipo de autenticação";
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error };
      }
    },
    [isSupported, loginOptionsMutation, loginVerifyMutation, toast]
  );

  // Buscar credenciais registradas
  const getCredentials = useCallback(async () => {
    try {
      if (!user) {
        return { success: false, credentials: [] };
      }

      const credentials = await credentialsMutation.mutateAsync();
      return { success: true, credentials };
    } catch (error) {
      console.error("Erro ao buscar credenciais:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar seus dispositivos registrados",
        variant: "destructive",
      });
      return { success: false, credentials: [], error };
    }
  }, [user, credentialsMutation, toast]);

  // Remover uma credencial
  const removeCredential = useCallback(
    async (credentialId: string) => {
      try {
        if (!user) {
          return { success: false };
        }

        const result = await removeCredentialMutation.mutateAsync(credentialId);

        if (result.success) {
          toast({
            title: "Dispositivo removido",
            description: "O dispositivo foi removido com sucesso",
            variant: "default",
          });
          return { success: true };
        } else {
          toast({
            title: "Falha ao remover",
            description: "Não foi possível remover o dispositivo",
            variant: "destructive",
          });
          return { success: false };
        }
      } catch (error) {
        console.error("Erro ao remover credencial:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao remover o dispositivo",
          variant: "destructive",
        });
        return { success: false, error };
      }
    },
    [user, removeCredentialMutation, toast]
  );

  return {
    isSupported,
    isPending:
      registerOptionsMutation.isPending ||
      registerVerifyMutation.isPending ||
      loginOptionsMutation.isPending ||
      loginVerifyMutation.isPending ||
      credentialsMutation.isPending ||
      removeCredentialMutation.isPending,
    registerBiometric,
    loginWithBiometric,
    getCredentials,
    removeCredential,
  };
}
