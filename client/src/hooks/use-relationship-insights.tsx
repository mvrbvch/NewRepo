import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RelationshipInsight } from "@shared/schema";

/**
 * Hook para buscar e gerenciar insights de relacionamento
 */
export function useRelationshipInsights() {
  const queryClient = useQueryClient();

  // Buscar todos os insights do usuário
  const useAllInsights = () => {
    return useQuery({
      queryKey: ['/api/relationship-insights'],
      queryFn: async () => {
        const response = await apiRequest('/api/relationship-insights');
        return response as RelationshipInsight[];
      }
    });
  };

  // Buscar insights do casal (usuário e parceiro)
  const usePartnerInsights = () => {
    return useQuery({
      queryKey: ['/api/relationship-insights/partner'],
      queryFn: async () => {
        const response = await apiRequest('/api/relationship-insights/partner');
        return response as RelationshipInsight[];
      }
    });
  };

  // Buscar insight específico por ID
  const useInsightById = (id: number) => {
    return useQuery({
      queryKey: ['/api/relationship-insights', id],
      queryFn: async () => {
        const response = await apiRequest(`/api/relationship-insights/${id}`);
        return response as RelationshipInsight;
      },
      enabled: !!id, // Só executa se o ID for válido
    });
  };

  // Marcar insight como lido
  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: async (id: number) => {
        const response = await apiRequest(`/api/relationship-insights/${id}/read`, {
          method: 'POST'
        });
        return response;
      },
      onSuccess: (_, id) => {
        // Invalida as consultas para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ['/api/relationship-insights'] });
        queryClient.invalidateQueries({ queryKey: ['/api/relationship-insights/partner'] });
        queryClient.invalidateQueries({ queryKey: ['/api/relationship-insights', id] });
      }
    });
  };

  // Gerar novos insights manualmente (para testes/demonstração)
  const useGenerateInsights = () => {
    return useMutation({
      mutationFn: async (type?: string) => {
        const response = await apiRequest(`/api/relationship-insights/generate`, {
          method: 'POST',
          body: type ? { type } : {}
        });
        return response;
      },
      onSuccess: () => {
        // Invalida as consultas para forçar uma atualização
        queryClient.invalidateQueries({ queryKey: ['/api/relationship-insights'] });
        queryClient.invalidateQueries({ queryKey: ['/api/relationship-insights/partner'] });
      }
    });
  };

  return {
    useAllInsights,
    usePartnerInsights,
    useInsightById,
    useMarkAsRead,
    useGenerateInsights
  };
}