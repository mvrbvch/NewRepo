import * as React from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { UserType } from "../lib/types";
import { z } from "zod";

// Tipo do contexto de autenticação
type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<any, Error, LoginData>;
  registerMutation: UseMutationResult<any, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  refreshAuth: () => Promise<UserType | null>;
  isAuthenticated: boolean;
};

// Tipos de dados para login e registro
type LoginData = {
  username: string;
  password: string;
};

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phoneNumber: z.string().optional(),
});

type RegisterData = z.infer<typeof registerSchema>;

// Criação do contexto com valor padrão nulo
const AuthContext = React.createContext<AuthContextType | null>(null);

// Componente provedor de autenticação
function AuthProvider(props: { children: React.ReactNode }) {
  // Estado local
  const [user, setUser] = React.useState<UserType | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Verificar autenticação ao montar o componente
  React.useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticação...");
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (!isMounted) return;
        
        if (res.status === 401) {
          console.log("Usuário não autenticado");
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        
        const userData = await res.json();
        console.log("Usuário autenticado:", userData.username);
        
        if (isMounted) {
          setUser(userData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setUser(null);
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Mutação para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo de volta, ${userData.name}!`,
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao fazer login",
        description: "Nome de usuário ou senha incorretos",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para registro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo ao Nós Juntos, ${userData.name}!`,
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao criar conta",
        description: "Verifique os dados e tente novamente",
        variant: "destructive",
      });
    },
  });
  
  // Mutação para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout realizado",
        description: "Você saiu do Nós Juntos",
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao fazer logout",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });
  
  // Função para forçar atualização do estado de autenticação
  const refreshAuth = async (): Promise<UserType | null> => {
    try {
      console.log("Forçando atualização de autenticação...");
      const res = await fetch("/api/user", {
        credentials: "include",
      });
      
      if (res.status === 401) {
        setUser(null);
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }
      
      const userData = await res.json();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Erro ao atualizar autenticação:", err);
      return null;
    }
  };
  
  // Verificar se o usuário está autenticado
  const isAuthenticated = !!user;
  
  // Valor do contexto
  const contextValue: AuthContextType = {
    user,
    isLoading,
    error,
    loginMutation,
    registerMutation,
    logoutMutation,
    refreshAuth,
    isAuthenticated,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto de autenticação
function useAuth() {
  const context = React.useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
}

export { AuthContext, AuthProvider, useAuth };
