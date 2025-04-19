import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { UserType } from "@/lib/types";
import { z } from "zod";

// Tipos para o contexto de autenticação
type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserType, Error, LoginData>;
  registerMutation: UseMutationResult<UserType, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

// Tipo para os dados de login
export type LoginData = {
  username: string;
  password: string;
};

// Validação de registro com Zod
const registerSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Por favor, informe um email válido"),
  phoneNumber: z.string().optional(),
});

// Tipo para os dados de registro
export type RegisterData = z.infer<typeof registerSchema>;

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Provedor do contexto
export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado para controlar o carregamento e o usuário
  const [authState, setAuthState] = useState<{
    user: UserType | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  // Carregar os dados do usuário na inicialização
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          setAuthState(prev => ({ ...prev, user: null, isLoading: false }));
          return;
        }
        
        if (!res.ok) {
          throw new Error(`Erro: ${res.status}`);
        }
        
        const userData = await res.json();
        setAuthState(prev => ({ 
          ...prev, 
          user: userData, 
          isLoading: false 
        }));
      } catch (error) {
        setAuthState(prev => ({ 
          ...prev, 
          user: null, 
          isLoading: false,
          error: error instanceof Error ? error : new Error(String(error))
        }));
      }
    };
    
    fetchUser();
  }, []);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserType) => {
      queryClient.setQueryData(["/api/user"], user);
      setAuthState(prev => ({ ...prev, user }));
      toast({
        title: "Login bem sucedido",
        description: `Bem-vindo(a), ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao entrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: UserType) => {
      queryClient.setQueryData(["/api/user"], user);
      setAuthState(prev => ({ ...prev, user }));
      toast({
        title: "Cadastro bem sucedido",
        description: `Bem-vindo(a), ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      setAuthState(prev => ({ ...prev, user: null }));
      toast({
        title: "Logout bem sucedido",
        description: "Você saiu da sua conta.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        isLoading: authState.isLoading,
        error: authState.error,
        loginMutation,
        registerMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}