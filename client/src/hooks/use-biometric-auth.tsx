import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './use-auth';
import { toast } from './use-toast';

// Versão simplificada que apenas emite mensagem que biometria está desativada
export function useBiometricAuth() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState<boolean>(false);
  
  // Verificar suporte de biometria ao carregar o hook
  useEffect(() => {
    setIsSupported(false); // Desativa biometria temporariamente
    // Não mostrar toast automaticamente para não confundir usuários
  }, []);
  
  // Função simplificada que retorna always false
  const registerBiometric = useCallback(async (deviceName: string) => {
    toast({
      title: "Funcionalidade removida",
      description: "Autenticação biométrica está temporariamente indisponível",
      variant: "default"
    });
    return { success: false };
  }, []);
  
  // Login com biometria - versão simplificada que retorna sempre false
  const loginWithBiometric = useCallback(async (username: string) => {
    toast({
      title: "Funcionalidade removida",
      description: "Autenticação biométrica está temporariamente indisponível",
      variant: "default"
    });
    return { success: false };
  }, []);
  
  // Buscar credenciais registradas
  const getCredentials = useCallback(async () => {
    return { success: false, credentials: [] };
  }, []);
  
  // Remover uma credencial
  const removeCredential = useCallback(async (credentialId: string) => {
    return { success: false };
  }, []);
  
  return {
    isSupported: false,
    isPending: false,
    registerBiometric,
    loginWithBiometric,
    getCredentials,
    removeCredential
  };
}