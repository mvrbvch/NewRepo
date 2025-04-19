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

// Criar o contexto com um valor padrão seguro
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  loginMutation: {
    mutate: () => {},
    mutateAsync: async () => ({
      id: 0,
      name: "",
      username: "",
      email: "",
      partnerStatus: "none",
      onboardingComplete: false,
    }),
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    status: "idle",
    variables: undefined,
    isIdle: true,
    submittedAt: 0,
    reset: () => {},
    context: undefined,
    isPaused: false,
  },
  registerMutation: {
    mutate: () => {},
    mutateAsync: async () => ({
      id: 0,
      name: "",
      username: "",
      email: "",
      partnerStatus: "none",
      onboardingComplete: false,
    }),
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    status: "idle",
    variables: undefined,
    isIdle: true,
    submittedAt: 0,
    reset: () => {},
    context: undefined,
    isPaused: false,
  },
  logoutMutation: {
    mutate: () => {},
    mutateAsync: async () => {},
    data: undefined,
    error: null,
    isPending: false,
    isError: false,
    isSuccess: false,
    failureCount: 0,
    failureReason: null,
    status: "idle",
    variables: undefined,
    isIdle: true,
    submittedAt: 0,
    reset: () => {},
    context: undefined,
    isPaused: false,
  },
});

// Simplified AuthProvider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Extraímos o toast diretamente do módulo para não usar um hook
  // Desta forma evitamos qualquer problema de ordem dos hooks
  const toastState = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserType | null, Error, UserType | null>({
    queryKey: ["/api/user"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        if (res.status === 401) {
          return null;
        }

        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }

        const userData = await res.json();
        return userData as UserType; // Garantir o tipo esperado
      } catch (error) {
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: UserType) => {
      queryClient.setQueryData(["/api/user"], user);
      toastState.toast({
        title: "Login bem sucedido",
        description: `Bem-vindo(a), ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toastState.toast({
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
      toastState.toast({
        title: "Cadastro bem sucedido",
        description: `Bem-vindo(a), ${user.name}!`,
      });
    },
    onError: (error: Error) => {
      toastState.toast({
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
      toastState.toast({
        title: "Logout bem sucedido",
        description: "Você saiu da sua conta.",
      });
    },
    onError: (error: Error) => {
      toastState.toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null, // Garantir que user nunca é undefined
        isLoading: isLoading,
        error: error as Error | null,
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
  return context;
}
