import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserType } from "@/lib/types";
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
  
  // Definindo todas as queries e mutations em um único bloco de componente
  // para garantir que a ordem de chamada dos hooks seja sempre a mesma
  
  // Query principal para obter o usuário atual
  const userQuery = useQuery<UserType | null>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        console.log("Verificando autenticação do usuário...");
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          console.log("Usuário não autenticado");
          return null;
        }
        
        if (!res.ok) {
          console.error(`Erro na requisição: ${res.status}`);
          throw new Error(`Error: ${res.status}`);
        }
        
        const userData = await res.json();
        console.log("Usuário autenticado:", userData.username);
        return userData;
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        return null;
      }
    },
    // Aumentar frequência de refetch para detectar mudanças no estado de autenticação
    refetchInterval: 60000, // Verificar a cada minuto
    refetchOnWindowFocus: true, // Verificar quando a janela ganha foco
  });

  // Extraindo dados da query para uso posterior
  const user = userQuery.data;
  const error = userQuery.error;
  const isLoading = userQuery.isLoading;
  const refetchUser = userQuery.refetch;

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserType) => {
      queryClient.setQueryData(["/api/user"], user);
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

  // Mutation para cadastro
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user: UserType) => {
      queryClient.setQueryData(["/api/user"], user);
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

  // Função para forçar atualização do estado de autenticação
  const refreshAuth = async (): Promise<UserType | null> => {
    try {
      console.log("Forçando atualização de autenticação do usuário...");
      const result = await refetchUser();
      // Garantir que sempre retornamos UserType | null, nunca undefined
      return result.data ? result.data : null;
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
