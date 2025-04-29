import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { HouseholdTaskType, TaskCompletionHistoryType, UserType } from "@/lib/types";
import { format, isAfter, isBefore, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User as UserIcon,
  AlertTriangle,
  Calendar as CalendarIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskCompletionHistoryProps {
  taskId: number;
  userId?: number;
}

export default function TaskCompletionHistory({ taskId, userId }: TaskCompletionHistoryProps) {
  // Estado para filtros
  const [timeRange, setTimeRange] = useState<string>("all"); 
  
  // Obter dados do usuário autenticado
  const { user } = useAuth();
  
  // Calcular datas para filtro
  const getFilterDates = () => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        return { startDate, endDate: now };
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        return { startDate, endDate: now };
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        return { startDate, endDate: now };
      default:
        return null; // Retorna null para buscar todos os registros
    }
  };
  
  // Construir URL com parâmetros de filtro
  const buildQueryUrl = () => {
    let url = `/api/tasks/${taskId}/completion-history`;
    const dates = getFilterDates();
    
    if (dates) {
      const startDateStr = dates.startDate.toISOString();
      const endDateStr = dates.endDate.toISOString();
      url += `?startDate=${startDateStr}&endDate=${endDateStr}`;
    }
    
    return url;
  };

  // Buscar histórico de conclusão
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<{ task: HouseholdTaskType; history: TaskCompletionHistoryType[] }>({
    queryKey: ['/api/tasks/completion-history', taskId, timeRange],
    queryFn: () => apiRequest(buildQueryUrl()),
    enabled: !!taskId
  });
  
  // Efeito para recarregar dados quando filtros mudam
  useEffect(() => {
    refetch();
  }, [timeRange, refetch]);
  
  // Função auxiliar para formatar datas
  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) return "Data inválida";
    
    return format(dateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };
  
  // Função para determinar status da conclusão
  const getCompletionStatus = (record: TaskCompletionHistoryType) => {
    if (!record.isCompleted) return "não_concluída";
    
    if (record.expectedDate) {
      const completedDate = new Date(record.completedDate);
      const expectedDate = new Date(record.expectedDate);
      
      if (isAfter(completedDate, expectedDate)) {
        return "atrasada";
      }
    }
    
    return "concluída";
  };
  
  // Renderização de cada registro do histórico
  const renderHistoryRecord = (record: TaskCompletionHistoryType, index: number) => {
    const status = getCompletionStatus(record);
    
    return (
      <div key={record.id || index} className="mb-4 last:mb-0">
        <div className="flex items-start gap-2">
          {status === "concluída" ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
          ) : status === "atrasada" ? (
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-1" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500 mt-1" />
          )}
          
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <Badge variant={
                  status === "concluída" ? "success" : 
                  status === "atrasada" ? "warning" : "destructive"
                }>
                  {status === "concluída" ? "Concluída" : 
                   status === "atrasada" ? "Concluída com atraso" : "Não concluída"}
                </Badge>
                
                {record.userId === user?.id ? (
                  <Badge variant="outline">Por você</Badge>
                ) : (
                  <Badge variant="outline">Pelo parceiro</Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                {formatDate(record.createdAt || record.completedDate)}
              </div>
            </div>
            
            <div className="mt-2 space-y-1 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Concluída em: {formatDate(record.completedDate)}</span>
              </div>
              
              {record.expectedDate && (
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Esperada para: {formatDate(record.expectedDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {index < (data?.history.length || 0) - 1 && (
          <Separator className="my-4" />
        )}
      </div>
    );
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Estado de erro
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Conclusão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-red-500">Erro ao carregar o histórico.</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Renderização principal
  return (
    <Card>
      <CardHeader className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Histórico de Conclusão</CardTitle>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value)}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Filtrar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tudo</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Últimos 3 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {data?.history && data.history.length > 0 ? (
          <ScrollArea className="h-[350px] pr-3">
            {data.history.map((record, index) => renderHistoryRecord(record, index))}
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">
              Nenhum registro de conclusão encontrado para esta tarefa.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}