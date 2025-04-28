import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { isMobile } from '../lib/utils';

/**
 * Este hook gerencia autenticação biométrica para aplicativos React Native nativos
 * Simula as interações biométricas em dispositivos iOS (Touch ID/Face ID) e Android.
 * 
 * Em um ambiente real de produção, você integraria:
 * - Para iOS: react-native-touch-id ou react-native-biometrics
 * - Para Android: react-native-biometrics
 */
export function useNativeBiometricAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  
  // Verificar suporte de biometria ao carregar o hook
  useEffect(() => {
    // Em um aplicativo real, isso seria substituído por verificação real do recurso nativo
    const checkSupport = async () => {
      try {
        // Esta é uma simulação - em um app real, você usaria APIs nativas
        // como TouchID.isSupported() para iOS ou ReactNativeBiometrics.isSensorAvailable() para Android
        const mobile = isMobile();
        setIsSupported(mobile);
        
        // Detectar plataforma
        if (mobile) {
          const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
          if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            setPlatform('ios');
          } else if (/android/i.test(userAgent)) {
            setPlatform('android');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar suporte biométrico nativo:', error);
        setIsSupported(false);
      }
    };
    
    checkSupport();
  }, []);
  
  // Buscar opções de registro
  const registerOptionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/webauthn/register-options');
      return await response.json();
    }
  });
  
  // Verificar resposta de registro
  const registerVerifyMutation = useMutation({
    mutationFn: async ({ deviceName, nativeId }: { deviceName: string, nativeId: string }) => {
      // Em um app real, você enviaria informações seguras da autenticação nativa
      const response = await apiRequest('POST', '/api/native-biometric/register', {
        deviceName,
        biometricId: nativeId,
        platform
      });
      return await response.json();
    }
  });
  
  // Login com biometria nativa
  const loginVerifyMutation = useMutation({
    mutationFn: async ({ username, nativeId }: { username: string, nativeId: string }) => {
      const response = await apiRequest('POST', '/api/native-biometric/login', {
        username,
        biometricId: nativeId,
        platform
      });
      return await response.json();
    }
  });
  
  // Buscar credenciais registradas
  const credentialsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/native-biometric/credentials');
      return await response.json();
    }
  });
  
  // Remover uma credencial
  const removeCredentialMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const response = await apiRequest('DELETE', `/api/native-biometric/credentials/${credentialId}`);
      return await response.json();
    }
  });
  
  // Registrar nova credencial biométrica
  const registerBiometric = useCallback(async (deviceName: string) => {
    try {
      // Verifica se o usuário está autenticado
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para registrar biometria",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Verifica se o dispositivo é compatível
      if (!isSupported) {
        toast({
          title: "Dispositivo não compatível",
          description: "Seu dispositivo não suporta autenticação biométrica",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Simular solicitação de biometria - em um app real, você usaria APIs nativas
      // por exemplo TouchID.authenticate() ou ReactNativeBiometrics.simplePrompt()
      const promptBiometric = async (): Promise<string> => {
        // Simulação: Mostrar um diálogo personalizado pedindo ao usuário para escanear biometria
        return new Promise((resolve, reject) => {
          // Solicitar permissão do usuário
          const userConfirmed = window.confirm(
            platform === 'ios' 
              ? "Usar Touch ID/Face ID para registrar este dispositivo?" 
              : "Usar sua impressão digital para registrar este dispositivo?"
          );
          
          if (userConfirmed) {
            // Simulando um ID exclusivo - em um app real, isso seria fornecido pela API de biometria nativa
            // após uma verificação de biometria bem-sucedida
            const mockBiometricId = `native_bio_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            resolve(mockBiometricId);
          } else {
            reject(new Error("Autenticação biométrica cancelada pelo usuário"));
          }
        });
      };
      
      // Solicitar biometria nativa
      const nativeId = await promptBiometric();
      
      // Enviar para o servidor
      const verificationResult = await registerVerifyMutation.mutateAsync({
        deviceName: deviceName || `Dispositivo ${platform}`,
        nativeId
      });
      
      if (verificationResult.success) {
        toast({
          title: "Biometria registrada",
          description: "Seu dispositivo foi registrado com sucesso",
          variant: "default"
        });
        return { success: true, credential: verificationResult.credential };
      } else {
        const errorMessage = verificationResult.message || "Não foi possível registrar seu dispositivo";
        toast({
          title: "Falha no registro",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: verificationResult };
      }
    } catch (error) {
      console.error('Erro ao registrar biometria nativa:', error);
      let errorMessage = "Ocorreu um erro ao registrar biometria";
      
      // Tratar erros específicos
      if (error instanceof Error) {
        if (error.message.includes("cancelada")) {
          errorMessage = "Registro cancelado pelo usuário";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  }, [user, isSupported, platform, registerVerifyMutation, toast]);
  
  // Login com biometria
  const loginWithBiometric = useCallback(async (username: string) => {
    try {
      // Verificar suporte
      if (!isSupported) {
        toast({
          title: "Dispositivo não compatível",
          description: "Seu dispositivo não suporta autenticação biométrica",
          variant: "destructive"
        });
        return { success: false };
      }
      
      // Simular solicitação de biometria nativa - em um app real, você usaria APIs nativas
      const promptBiometric = async (): Promise<string> => {
        return new Promise((resolve, reject) => {
          // Solicitar permissão do usuário
          const userConfirmed = window.confirm(
            platform === 'ios' 
              ? "Usar Touch ID/Face ID para acessar sua conta?" 
              : "Usar sua impressão digital para acessar sua conta?"
          );
          
          if (userConfirmed) {
            // Simulando um ID exclusivo - em um app real, você recuperaria o ID armazenado
            // associado ao usuário após verificação biométrica bem-sucedida
            const mockBiometricId = `native_bio_access_${Date.now()}`;
            resolve(mockBiometricId);
          } else {
            reject(new Error("Autenticação biométrica cancelada pelo usuário"));
          }
        });
      };
      
      // Solicitar biometria nativa
      const nativeId = await promptBiometric();
      
      // Enviar para o servidor
      const verificationResult = await loginVerifyMutation.mutateAsync({
        username,
        nativeId
      });
      
      if (verificationResult.success) {
        toast({
          title: "Login realizado",
          description: "Você foi autenticado com biometria",
          variant: "default"
        });
        return { success: true, user: verificationResult.user };
      } else {
        toast({
          title: "Falha na autenticação",
          description: "Não foi possível autenticar com biometria",
          variant: "destructive"
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Erro ao fazer login com biometria nativa:', error);
      let errorMessage = "Ocorreu um erro ao autenticar com biometria";
      
      // Tratar erros específicos
      if (error instanceof Error) {
        if (error.message.includes("cancelada")) {
          errorMessage = "Autenticação cancelada pelo usuário";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  }, [isSupported, platform, loginVerifyMutation, toast]);
  
  // Buscar credenciais registradas
  const getCredentials = useCallback(async () => {
    try {
      if (!user) {
        return { success: false, credentials: [] };
      }
      
      const credentials = await credentialsMutation.mutateAsync();
      return { success: true, credentials };
    } catch (error) {
      console.error('Erro ao buscar credenciais biométricas nativas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar seus dispositivos registrados",
        variant: "destructive"
      });
      return { success: false, credentials: [], error };
    }
  }, [user, credentialsMutation, toast]);
  
  // Remover uma credencial
  const removeCredential = useCallback(async (credentialId: string) => {
    try {
      if (!user) {
        return { success: false };
      }
      
      const result = await removeCredentialMutation.mutateAsync(credentialId);
      
      if (result.success) {
        toast({
          title: "Dispositivo removido",
          description: "O dispositivo foi removido com sucesso",
          variant: "default"
        });
        return { success: true };
      } else {
        toast({
          title: "Falha ao remover",
          description: "Não foi possível remover o dispositivo",
          variant: "destructive"
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Erro ao remover credencial biométrica nativa:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao remover o dispositivo",
        variant: "destructive"
      });
      return { success: false, error };
    }
  }, [user, removeCredentialMutation, toast]);
  
  return {
    isSupported,
    platform,
    isPending: 
      registerOptionsMutation.isPending || 
      registerVerifyMutation.isPending || 
      loginVerifyMutation.isPending ||
      credentialsMutation.isPending ||
      removeCredentialMutation.isPending,
    registerBiometric,
    loginWithBiometric,
    getCredentials,
    removeCredential
  };
}