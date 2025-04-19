// Importa o tipo UserType para definir AuthContextType
import { UserType } from "@/lib/types";
import { UseMutationResult } from "@tanstack/react-query";

// Define o tipo AuthContextType para quem precisa importá-lo deste arquivo
export type AuthContextType = {
  user: UserType | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<UserType, Error, LoginData>;
  registerMutation: UseMutationResult<UserType, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export type LoginData = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  password: string;
  name: string;
  email: string;
  phoneNumber?: string;
};

// Reexportar de @/providers/auth-provider para manter compatibilidade
// com componentes que importam o hook daqui
export { useAuth, AuthContext } from "@/providers/auth-provider";
