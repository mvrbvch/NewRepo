import React from "react";
import { useParams, useLocation } from "wouter";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Star, Check, Lightbulb, Sparkles, Shapes, Clock, HandHeart } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Mapeia tipos de insight para ícones e cores
const insightTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  task_balance: { 
    icon: <Shapes className="h-5 w-5" />, 
    color: "bg-blue-100 text-blue-800" 
  },
  communication: { 
    icon: <Sparkles className="h-5 w-5" />, 
    color: "bg-purple-100 text-purple-800" 
  },
  quality_time: { 
    icon: <Clock className="h-5 w-5" />, 
    color: "bg-green-100 text-green-800" 
  },
  relationship_goals: { 
    icon: <Star className="h-5 w-5" />, 
    color: "bg-amber-100 text-amber-800" 
  },
  special_dates: { 
    icon: <HandHeart className="h-5 w-5" />, 
    color: "bg-red-100 text-red-800" 
  },
  general: { 
    icon: <Lightbulb className="h-5 w-5" />, 
    color: "bg-gray-100 text-gray-800" 
  },
};

// Mapeia sentimentos para cores
const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  negative: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-800",
};

export function InsightDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { useInsightById, useMarkAsRead } = useRelationshipInsights();
  
  const insightId = parseInt(id);
  const insightQuery = useInsightById(insightId);
  const markAsRead = useMarkAsRead();

  const handleGoBack = () => {
    setLocation("/insights");
  };

  const handleMarkAsRead = () => {
    if (insightQuery.data && !insightQuery.data.userRead) {
      markAsRead.mutate(insightId);
    }
  };

  if (insightQuery.isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (insightQuery.isError || !insightQuery.data) {
    return (
      <div className="w-full flex flex-col items-center py-12 gap-4">
        <p className="text-red-500">Erro ao carregar detalhes do insight</p>
        <Button onClick={handleGoBack} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const insight = insightQuery.data;
  
  // Obtém a configuração para o tipo de insight
  const typeConfig = insightTypeConfig[insight.insightType.toLowerCase()] || insightTypeConfig.general;
  
  // Formata a data de criação
  const createdAtDate = typeof insight.createdAt === 'string' 
    ? new Date(insight.createdAt) 
    : insight.createdAt;
  
  const formattedDate = createdAtDate
    ? format(createdAtDate, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
    : '';

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleGoBack}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Insights
        </Button>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={typeConfig.color}
              >
                <span className="flex items-center gap-1">
                  {typeConfig.icon}
                  {insight.insightType.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </Badge>
              
              {insight.sentiment && (
                <Badge 
                  variant="secondary" 
                  className={sentimentColors[insight.sentiment.toLowerCase()]}
                >
                  {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
                </Badge>
              )}

              {!insight.userRead && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Novo
                </Badge>
              )}
            </div>
            
            {insight.score && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-amber-500" />
                {insight.score}/10
              </Badge>
            )}
          </div>
          
          <CardTitle className="text-2xl mt-3">{insight.title}</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {formattedDate}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="py-4">
          <div className="whitespace-pre-line text-gray-700 text-base leading-relaxed">
            {insight.content}
          </div>
          
          {insight.actions && insight.actions.length > 0 && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-base mb-3">Ações sugeridas:</h4>
              <ul className="space-y-2">
                {insight.actions.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end pt-2 border-t">
          {!insight.userRead && (
            <Button 
              variant="default" 
              onClick={handleMarkAsRead}
              disabled={markAsRead.isPending}
            >
              {markAsRead.isPending ? "Marcando..." : "Marcar como lido"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}