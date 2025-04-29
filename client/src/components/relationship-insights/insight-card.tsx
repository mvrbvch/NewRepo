import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Star, Check, Clock, Sparkles, Shapes, HandHeart, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RelationshipInsight } from "@shared/schema";
import { useRelationshipInsights } from "@/hooks/use-relationship-insights";

// Mapeia tipos de insight para ícones e cores
const insightTypeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  task_balance: { 
    icon: <Shapes className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
  communication: { 
    icon: <Sparkles className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
  quality_time: { 
    icon: <Clock className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
  relationship_goals: { 
    icon: <Star className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
  special_dates: { 
    icon: <HandHeart className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
  general: { 
    icon: <Lightbulb className="h-4 w-4" />, 
    color: "bg-[#F27474]/10 text-[#F27474]" 
  },
};

// Mapeia sentimentos para cores
const sentimentColors: Record<string, string> = {
  positive: "bg-[#F27474]/10 text-[#F27474]",
  negative: "bg-[#F27474]/10 text-[#F27474]",
  neutral: "bg-[#F27474]/10 text-[#F27474]",
};

interface InsightCardProps {
  insight: RelationshipInsight;
  isPartner?: boolean;
}

export function InsightCard({ insight, isPartner = false }: InsightCardProps) {
  const { useMarkAsRead } = useRelationshipInsights();
  const markAsRead = useMarkAsRead();

  // Verifica se o insight já foi lido pelo usuário
  const isRead = isPartner ? insight.partnerRead : insight.userRead;

  const handleMarkAsRead = () => {
    if (!isRead) {
      markAsRead.mutate(insight.id);
    }
  };

  // Obtém a configuração para o tipo de insight
  const typeConfig = insightTypeConfig[insight.insightType.toLowerCase()] || insightTypeConfig.general;
  
  // Formata a data de criação
  const createdAtDate = typeof insight.createdAt === 'string' 
    ? new Date(insight.createdAt) 
    : insight.createdAt;
  
  const timeAgo = createdAtDate
    ? formatDistanceToNow(createdAtDate, { addSuffix: true, locale: ptBR })
    : '';

  return (
    <Card className={cn(
      "w-full transition-all duration-300 overflow-hidden",
      !isRead 
        ? "border-[#F27474]/30 shadow-sm" 
        : "border-gray-200"
    )}>
      {!isRead && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-r-[30px] border-t-[#F27474]/20 border-r-transparent z-10"></div>
      )}
      
      <CardHeader className="pb-1 pt-3 px-3 relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-1">
            <Badge 
              variant="secondary" 
              className={cn(typeConfig.color, "text-xs font-normal")}
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
                className={cn(sentimentColors[insight.sentiment.toLowerCase()], "text-xs font-normal")}
              >
                {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
              </Badge>
            )}

            {!isRead && (
              <Badge variant="secondary" className="bg-[#F27474]/10 text-[#F27474] text-xs font-normal">
                Novo
              </Badge>
            )}
          </div>
          
          {insight.score && (
            <Badge variant="outline" className="flex items-center gap-1 bg-[#F27474]/5 text-[#F27474] text-xs font-normal border-[#F27474]/20">
              <Star className="h-3 w-3" />
              {insight.score}/10
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-lg mt-2 font-medium text-[#F27474]">{insight.title}</CardTitle>
        <CardDescription className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-3 py-2">
        <div className="whitespace-pre-line text-sm text-gray-700 leading-relaxed">
          {insight.content}
        </div>
        
        {insight.actions && Array.isArray(insight.actions) && insight.actions.length > 0 && (
          <div className="mt-4 bg-[#F27474]/5 p-3 rounded-md border border-[#F27474]/10">
            <h4 className="font-medium text-xs mb-2 text-gray-700 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#F27474]" />
              Ações sugeridas
            </h4>
            <ul className="space-y-1.5">
              {(insight.actions as any[]).map((action, index: number) => {
                // Verificar se a ação é uma string ou um objeto
                const actionText = typeof action === 'string' 
                  ? action 
                  : (action.action || action.description || JSON.stringify(action));
                
                return (
                  <li key={index} className="flex items-start gap-1.5 text-xs bg-white p-2 rounded border border-gray-100">
                    <Check className="h-3.5 w-3.5 text-[#F27474] mt-0.5 flex-shrink-0" />
                    <span>{actionText}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end pt-1 pb-3 px-3">
        {!isRead ? (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleMarkAsRead}
            disabled={markAsRead.isPending}
            className="h-8 px-3 text-xs font-normal bg-[#F27474] hover:bg-[#F27474]/90"
          >
            {markAsRead.isPending ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                Marcando...
              </>
            ) : (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                Marcar como lido
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Futuramente: Implementar ação para ver detalhes */}}
            className="h-8 px-3 text-xs font-normal text-gray-500 hover:text-[#F27474] hover:border-[#F27474]/30"
          >
            Ver detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}