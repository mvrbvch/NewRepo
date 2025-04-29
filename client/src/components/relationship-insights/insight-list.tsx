import React from "react";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { InsightCard } from "./insight-card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
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
    insightsQuery.refetch();
  };

  const handleGenerateInsights = () => {
    generateInsights.mutate();
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
      <EmptyState
        icon={<RefreshCw className="h-12 w-12 text-gray-400" />}
        title="Nenhum insight encontrado"
        description="Não existem insights para mostrar neste momento."
        action={
          <Button 
            onClick={handleGenerateInsights}
            disabled={generateInsights.isPending}
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Insights"
            )}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {type === "all" ? "Todos os Insights" : "Insights do Casal"}
        </h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={insightsQuery.isRefetching}
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
          >
            {generateInsights.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Insights"
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