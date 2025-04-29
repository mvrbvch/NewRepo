import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Star, Check, Clock, Sparkles, Shapes, HandHeart } from "lucide-react";
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
      "w-full transition-all duration-300",
      !isRead ? "border-blue-300 shadow-md" : "border-gray-200"
    )}>
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

            {!isRead && (
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
        
        <CardTitle className="text-xl mt-2">{insight.title}</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {timeAgo}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="whitespace-pre-line text-gray-700">
          {insight.content}
        </div>
        
        {insight.actions && Array.isArray(insight.actions) && insight.actions.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Ações sugeridas:</h4>
            <ul className="space-y-1">
              {insight.actions.map((action: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end pt-2">
        {!isRead && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleMarkAsRead}
            disabled={markAsRead.isPending}
          >
            {markAsRead.isPending ? "Marcando..." : "Marcar como lido"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}