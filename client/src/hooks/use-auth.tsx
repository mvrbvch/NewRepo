import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { UserType } from "../lib/types";
import { z } from "zod";

type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserType, Error, LoginData>;
  registerMutation: UseMutationResult<UserType, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  refreshAuth: () => Promise<UserType | null>;
  isAuthenticated: boolean;
};

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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Verificar autenticação ao carregar o componente
  useEffect(() => {
    async function checkAuth() {
      try {
        console.log("Verificando autenticação do usuário...");
        const res = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          console.log("Usuário não autenticado");
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        if (!res.ok) {
          console.error(`Erro na requisição: ${res.status}`);
          throw new Error(`Error: ${res.status}`);
        }
        
        const userData = await res.json();
        console.log("Usuário autenticado:", userData.username);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuth();
    
    // Configurar um intervalo para verificar a autenticação periodicamente
    const authCheckInterval = setInterval(checkAuth, 60000); // a cada minuto
    
    return () => clearInterval(authCheckInterval);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login bem sucedido",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao entrar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData: UserType) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Cadastro bem sucedido",
        description: `Bem-vindo(a), ${userData.name}!`,
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao cadastrar",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logout bem sucedido",
        description: "Você saiu da sua conta.",
      });
    },
    onError: (err: Error) => {
      setError(err);
      toast({
        title: "Erro ao sair",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Função para forçar atualização do estado de autenticação
  const refreshAuth = async (): Promise<UserType | null> => {
    try {
      console.log("Forçando atualização de autenticação do usuário...");
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
    } catch (error) {
      console.error("Erro ao atualizar autenticação:", error);
      return null;
    }
  };

  // Verifica se o usuário está autenticado
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        registerMutation,
        logoutMutation,
        refreshAuth,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
