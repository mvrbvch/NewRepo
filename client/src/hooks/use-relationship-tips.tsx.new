import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TipCategory, RelationshipTipType } from "@/lib/types";

/**
 * Custom hook para gerenciar dicas de relacionamento
 */
export function useRelationshipTips() {
  /**
   * Hook para buscar todas as dicas do usuário
   */
  const useUserTips = () => {
    return useQuery({
      queryKey: ["relationshipTips", "user"],
      queryFn: async () => {
        const response = await fetch("/api/tips/user", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao buscar dicas de relacionamento");
        }
        
        return response.json() as Promise<RelationshipTipType[]>;
      }
    });
  };

  /**
   * Hook para buscar dicas do casal
   */
  const useCoupleTips = (partnerId?: number) => {
    return useQuery({
      queryKey: ["relationshipTips", "couple", partnerId],
      queryFn: async () => {
        if (!partnerId) {
          return [] as RelationshipTipType[];
        }
        
        const response = await fetch(`/api/tips/couple/${partnerId}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao buscar dicas do casal");
        }
        
        return response.json() as Promise<RelationshipTipType[]>;
      },
      enabled: !!partnerId // Só executa se tiver um parceiro ID válido
    });
  };

  /**
   * Hook para buscar dicas favoritas
   */
  const useFavoriteTips = () => {
    return useQuery({
      queryKey: ["relationshipTips", "favorites"],
      queryFn: async () => {
        const response = await fetch("/api/tips/favorites", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao buscar dicas favoritas");
        }
        
        return response.json() as Promise<RelationshipTipType[]>;
      }
    });
  };

  /**
   * Hook para buscar uma dica específica por ID
   */
  const useTipById = (id?: number) => {
    return useQuery({
      queryKey: ["relationshipTips", "tip", id],
      queryFn: async () => {
        if (!id) {
          throw new Error("ID da dica não fornecido");
        }
        
        const response = await fetch(`/api/tips/${id}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dica ${id}`);
        }
        
        return response.json() as Promise<RelationshipTipType>;
      },
      enabled: !!id // Só executa se tiver um ID válido
    });
  };

  /**
   * Hook para gerar uma nova dica
   */
  const useGenerateTip = () => {
    return useMutation({
      mutationFn: async ({ 
        partnerId, 
        category 
      }: { 
        partnerId?: number;
        category?: TipCategory;
      }) => {
        const response = await fetch("/api/tips/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            partnerId,
            category
          })
        });
        
        if (!response.ok) {
          throw new Error("Erro ao gerar nova dica");
        }
        
        return response.json() as Promise<RelationshipTipType>;
      },
      onSuccess: () => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipTips"] });
      }
    });
  };

  /**
   * Hook para adicionar uma dica aos favoritos
   */
  const useFavoriteTip = () => {
    return useMutation({
      mutationFn: async (tipId: number) => {
        const response = await fetch(`/api/tips/${tipId}/favorite`, {
          method: "POST",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao adicionar dica aos favoritos");
        }
        
        return response.json();
      },
      onSuccess: (_, tipId) => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipTips"] });
      }
    });
  };

  /**
   * Hook para remover uma dica dos favoritos
   */
  const useUnfavoriteTip = () => {
    return useMutation({
      mutationFn: async (tipId: number) => {
        const response = await fetch(`/api/tips/${tipId}/unfavorite`, {
          method: "POST",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao remover dica dos favoritos");
        }
        
        return response.json();
      },
      onSuccess: (_, tipId) => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipTips"] });
      }
    });
  };

  /**
   * Hook para excluir uma dica
   */
  const useDeleteTip = () => {
    return useMutation({
      mutationFn: async (tipId: number) => {
        const response = await fetch(`/api/tips/${tipId}`, {
          method: "DELETE",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao excluir dica");
        }
        
        return response.json();
      },
      onSuccess: () => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipTips"] });
      }
    });
  };

  return {
    useUserTips,
    useCoupleTips,
    useFavoriteTips,
    useTipById,
    useGenerateTip,
    useFavoriteTip,
    useUnfavoriteTip,
    useDeleteTip
  };
}