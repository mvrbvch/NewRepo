import React from "react";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { InsightCard } from "./insight-card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Lightbulb, HeartHandshake, Sparkles } from "lucide-react";
import { EmptyState } from "../shared/empty-state";

interface InsightListProps {
  type: "all" | "partner";
  isPartner?: boolean;
}

export function InsightList({ type, isPartner = false }: InsightListProps) {
  const { useAllInsights, usePartnerInsights, useGenerateInsights } = useRelationshipInsights();
  
  // Usa o hook apropriado com base no tipo
  const insightsQuery = type === "all" ? useAllInsights() : usePartnerInsights();
  
  // Hook para gerar novos insights
  const generateInsights = useGenerateInsights();

  const handleRefresh = () => {
    insightsQuery.refetch().catch(error => {
      console.error("Erro ao atualizar insights:", error);
    });
  };

  const handleGenerateInsights = () => {
    // Using tanstack/react-query v5 syntax
    generateInsights.mutate(undefined);
  };

  if (insightsQuery.isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-6">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#F27474]" />
          <p className="mt-2 text-sm text-gray-500">Carregando insights...</p>
        </div>
      </div>
    );
  }

  if (insightsQuery.isError) {
    return (
      <div className="w-full flex flex-col items-center py-6 gap-3">
        <p className="text-red-500 text-sm">Erro ao carregar insights</p>
        <Button onClick={handleRefresh} variant="outline" size="sm" className="text-xs">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const insights = insightsQuery.data || [];

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-4 text-center">
        <div className="flex flex-col items-center max-w-lg mx-auto">
          <div className="p-3 bg-[#F27474] bg-opacity-10 rounded-full mb-3">
            {type === "all" ? (
              <Lightbulb className="h-6 w-6 text-[#F27474]" />
            ) : (
              <HeartHandshake className="h-6 w-6 text-[#F27474]" />
            )}
          </div>
          <h3 className="text-base font-medium mb-1">Nenhum insight encontrado</h3>
          <p className="text-sm text-gray-600 mb-4">
            {type === "all" 
              ? "Gere novos insights para obter recomendações personalizadas." 
              : "Ainda não há insights para você e seu parceiro."}
          </p>
          <Button 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
            className="gap-1"
            size="sm"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">Gerar Insights</span>
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="mr-2 p-1.5 rounded-full">
            {type === "all" ? (
              <Lightbulb className="h-4 w-4 text-[#F27474]" />
            ) : (
              <HeartHandshake className="h-4 w-4 text-[#F27474]" />
            )}
          </div>
          <h2 className="text-base font-medium text-gray-800">
            {type === "all" ? "Todos os Insights" : "Insights do Casal"}
          </h2>
          {insightsQuery.data && insightsQuery.data.length > 0 && (
            <span className="ml-2 bg-[#F27474] bg-opacity-10 text-[#F27474] text-xs font-medium px-1.5 py-0.5 rounded-full">
              {insightsQuery.data.length}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={insightsQuery.isRefetching}
            className="h-8 px-2 border-gray-200 text-xs"
          >
            {insightsQuery.isRefetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button 
            size="sm" 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
            className="h-8 px-3 text-xs font-normal bg-[#F27474] hover:bg-[#F27474]/90"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Gerar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {insights.map((insight) => (
          <InsightCard 
            key={insight.id} 
            insight={insight} 
            isPartner={isPartner}
          />
        ))}
      </div>
    </div>
  );
}