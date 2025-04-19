import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast"; // Importar apenas a função toast, não o hook
import { UserType } from "@/lib/types";
import { z } from "zod";

type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserType, Error, LoginData>;
  registerMutation: UseMutationResult<UserType, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
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
  // Não usamos useToast() aqui para evitar dependência circular
  const [authState, setAuthState] = useState<{
    user: UserType | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  useEffect(() => {
    // Carregar dados do usuário ao iniciar
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
          throw new Error(`Error: ${res.status}`);
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
