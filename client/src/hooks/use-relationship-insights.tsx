import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { RelationshipInsight } from "@shared/schema";

/**
 * Custom hook para gerenciar insights de relacionamento
 */
export function useRelationshipInsights() {
  /**
   * Hook para buscar todos os insights
   */
  const useAllInsights = () => {
    return useQuery({
      queryKey: ["relationshipInsights", "all"],
      queryFn: async () => {
        const response = await fetch("/api/relationship-insights", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao buscar insights");
        }
        
        return response.json() as Promise<RelationshipInsight[]>;
      }
    });
  };

  /**
   * Hook para buscar insights de parceiro
   */
  const usePartnerInsights = () => {
    return useQuery({
      queryKey: ["relationshipInsights", "partner"],
      queryFn: async () => {
        const response = await fetch("/api/relationship-insights/partner", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao buscar insights de parceiro");
        }
        
        return response.json() as Promise<RelationshipInsight[]>;
      }
    });
  };

  /**
   * Hook para buscar um insight específico por ID
   */
  const useInsightById = (id: number) => {
    return useQuery({
      queryKey: ["relationshipInsights", id],
      queryFn: async () => {
        const response = await fetch(`/api/relationship-insights/${id}`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar insight ${id}`);
        }
        
        return response.json() as Promise<RelationshipInsight>;
      },
      enabled: !!id // Só executa se tiver um ID válido
    });
  };

  /**
   * Hook para marcar um insight como lido
   */
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: async (insightId: number) => {
        const response = await fetch(`/api/relationship-insights/${insightId}/read`, {
          method: "POST",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao marcar insight como lido");
        }
        
        return response.json();
      },
      onSuccess: (_, insightId) => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipInsights"] });
      }
    });
  };

  /**
   * Hook para excluir um insight
   */
  const useDeleteInsight = () => {
    return useMutation({
      mutationFn: async (insightId: number) => {
        const response = await fetch(`/api/relationship-insights/${insightId}`, {
          method: "DELETE",
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao excluir insight");
        }
        
        return response.json();
      },
      onSuccess: () => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipInsights"] });
      }
    });
  };

  /**
   * Hook para gerar um novo insight (útil para testes)
   */
  const useGenerateInsights = () => {
    return useMutation({
      mutationFn: async (type?: string) => {
        const response = await fetch("/api/relationship-insights/generate", {
          method: "POST",
          body: type ? JSON.stringify({ type }) : JSON.stringify({}),
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao gerar novos insights");
        }
        
        return response.json();
      },
      onSuccess: () => {
        // Invalida as queries para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ["relationshipInsights"] });
      }
    });
  };

  return {
    useAllInsights,
    usePartnerInsights,
    useInsightById,
    useMarkAsRead,
    useDeleteInsight,
    useGenerateInsights
  };
}