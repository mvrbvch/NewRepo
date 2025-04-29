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
        ? "border-primary/30 shadow-lg shadow-primary/10" 
        : "border-gray-200 hover:border-primary/20 hover:shadow-sm"
    )}>
      {!isRead && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-primary/20 border-r-transparent z-10"></div>
      )}
      
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(typeConfig.color, "font-medium shadow-sm")}
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
                className={cn(sentimentColors[insight.sentiment.toLowerCase()], "font-medium shadow-sm")}
              >
                {insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
              </Badge>
            )}

            {!isRead && (
              <Badge variant="secondary" className="bg-primary/10 text-primary font-medium shadow-sm">
                Novo
              </Badge>
            )}
          </div>
          
          {insight.score && (
            <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 font-semibold">
              <Star className="h-3 w-3 fill-current text-amber-500" />
              {insight.score}/10
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-xl mt-3 font-bold text-primary/90">{insight.title}</CardTitle>
        <CardDescription className="text-sm text-gray-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="whitespace-pre-line text-gray-700 leading-relaxed">
          {insight.content}
        </div>
        
        {insight.actions && Array.isArray(insight.actions) && insight.actions.length > 0 && (
          <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-100">
            <h4 className="font-semibold text-sm mb-3 text-slate-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Ações sugeridas
            </h4>
            <ul className="space-y-2">
              {(insight.actions as string[]).map((action: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end pt-3 pb-4">
        {!isRead ? (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleMarkAsRead}
            disabled={markAsRead.isPending}
            className="transition-all duration-300 hover:shadow-md"
          >
            {markAsRead.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marcando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Marcar como lido
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Futuramente: Implementar ação para ver detalhes */}}
            className="text-gray-500 hover:text-primary"
          >
            Ver detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}