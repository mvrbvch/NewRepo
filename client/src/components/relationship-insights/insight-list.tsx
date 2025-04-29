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
      <div className="w-full flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (insightsQuery.isError) {
    return (
      <div className="w-full flex flex-col items-center py-12 gap-4">
        <p className="text-red-500">Erro ao carregar insights</p>
        <Button onClick={handleRefresh} variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  }

  const insights = insightsQuery.data || [];

  if (insights.length === 0) {
    return (
      <div className="bg-primary/5 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center max-w-lg mx-auto">
          <div className="p-4 bg-white rounded-full shadow-md mb-4">
            {type === "all" ? (
              <Lightbulb className="h-12 w-12 text-primary/60" />
            ) : (
              <HeartHandshake className="h-12 w-12 text-primary/60" />
            )}
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum insight encontrado</h3>
          <p className="text-gray-600 mb-6">
            {type === "all" 
              ? "Não há insights disponíveis para mostrar. Gere novos insights para obter recomendações personalizadas." 
              : "Ainda não há insights de casal disponíveis. Gere novos insights para obter recomendações sobre seu relacionamento."}
          </p>
          <Button 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
            className="gap-2 px-6 py-2 shadow-sm"
            size="lg"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando insights...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Insights Agora
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="mr-3 p-2 bg-primary/10 rounded-full">
            {type === "all" ? (
              <Lightbulb className="h-5 w-5 text-primary" />
            ) : (
              <HeartHandshake className="h-5 w-5 text-primary" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            {type === "all" ? "Todos os Insights" : "Insights do Casal"}
          </h2>
          {insightsQuery.data && insightsQuery.data.length > 0 && (
            <span className="ml-2 bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">
              {insightsQuery.data.length}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={insightsQuery.isRefetching}
            className="border-gray-200 hover:border-primary/30 hover:bg-primary/5"
          >
            {insightsQuery.isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Atualizar</span>
          </Button>
          <Button 
            size="sm" 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
            className="gap-1 font-medium"
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-4 w-4" />
                Gerar Insights
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