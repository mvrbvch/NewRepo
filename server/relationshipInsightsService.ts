import OpenAI from "openai";
import { IStorage } from "./storage";
import {
  HouseholdTask,
  Event,
  InsertRelationshipInsight,
} from "@shared/schema";
import { formatDateSafely } from "./utils";
import { PerplexityService } from "./perplexityService";

// Inicializar o cliente OpenAI
// O modelo mais recente da OpenAI é "gpt-4o" que foi lançado em 13 de maio de 2024. Não altere isso a menos que explicitamente solicitado pelo usuário
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEYL,
});

// Inicializar o serviço Perplexity (alternativa gratuita)
const perplexityService = new PerplexityService();

// Tipos de insight que podem ser gerados
export enum InsightType {
  TASK_BALANCE = "task_balance", // Equilíbrio na distribuição de tarefas
  COMMUNICATION = "communication", // Padrões de comunicação
  QUALITY_TIME = "quality_time", // Tempo de qualidade juntos
  RELATIONSHIP_GOALS = "relationship_goals", // Objetivos de relacionamento
  HABITS = "habits", // Hábitos
  SPECIAL_DATES = "special_dates", // Datas especiais
  GENERAL = "general", // Insight geral
}

export interface TaskDistributionData {
  user: {
    id: number;
    name: string;
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  partner: {
    id: number;
    name: string;
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  categories: Record<
    string,
    {
      user: number;
      partner: number;
    }
  >;
}

interface CommunicationData {
  messageCount: number;
  responseTime: number;
  initiationBalance: number; // Positivo se o usuário inicia mais, negativo se o parceiro inicia mais
  topicDiversity: number; // 0-1, quanto maior, mais diversos os tópicos
  positiveInteractions: number;
  negativeInteractions: number;
  emotionalTone: string; // "positive", "negative", "neutral"
}

interface QualityTimeData {
  eventsPerWeek: number;
  averageDuration: number;
  canceledEvents: number;
  typeDistribution: Record<string, number>;
  sharedPreferences: string[];
}

export interface InsightGenerationResult {
  type: InsightType;
  title: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number; // 1-10
  actions: string[];
  rawData: any;
  metadata?: any;
}

/**
 * Serviço para gerar insights personalizados de relacionamento usando IA
 */
export class RelationshipInsightsService {
  private storage: IStorage;
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 86400000; // 24 horas = 86400000 ms

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Inicia o serviço de geração de insights, verificando periodicamente por novos dados
   */
  public start(): void {
    if (this.intervalId) {
      console.warn("O serviço de insights já está em execução");
      return;
    }

    console.log("Iniciando serviço de insights de relacionamento...");

    // Gera insights imediatamente na inicialização
    this.generateInsightsForAllCouples();

    // Configura a verificação periódica
    this.intervalId = setInterval(() => {
      this.generateInsightsForAllCouples();
    }, this.checkIntervalMs);

    console.log(
      "Serviço de insights de relacionamento inicializado com sucesso"
    );
  }

  /**
   * Para o serviço de geração de insights
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Serviço de insights de relacionamento parado");
    }
  }

  /**
   * Gera insights para todos os casais no sistema
   */
  private async generateInsightsForAllCouples(): Promise<void> {
    try {
      // Implementação para o MVP: considere apenas usuários com parceiros
      const usersWithPartners = await this.getUsersWithPartners();

      for (const user of usersWithPartners) {
        if (user.id < user.partnerId) {
          // Evita gerar insights duplicados para o mesmo casal
          await this.generateInsightsForCouple(user.id, user.partnerId);
        }
      }
    } catch (error) {
      console.error("Erro ao gerar insights para todos os casais:", error);
    }
  }

  /**
   * Obtém todos os usuários que têm parceiros
   */
  private async getUsersWithPartners(): Promise<
    { id: number; partnerId: number }[]
  > {
    try {
      // Implementação simplificada para o MVP
      // Em um ambiente de produção, usaríamos uma consulta SQL otimizada
      const allUsers = await this.getAllUsers();
      return allUsers
        .filter((user) => user.partnerId !== null)
        .map((user) => ({
          id: user.id,
          partnerId: user.partnerId!,
        }));
    } catch (error) {
      console.error("Erro ao obter usuários com parceiros:", error);
      return [];
    }
  }

  /**
   * Obtém todos os usuários (implementação simplificada para o MVP)
   */
  private async getAllUsers(): Promise<
    { id: number; partnerId: number | null }[]
  > {
    // Implementação para o MVP - em produção, implementaríamos uma consulta otimizada
    // que retorna apenas o necessário
    const userPromises = [];
    for (let i = 1; i <= 100; i++) {
      // Limite arbitrário para o MVP
      userPromises.push(this.storage.getUser(i));
    }

    const users = await Promise.all(userPromises);
    return users.filter(Boolean).map((user) => ({
      id: user!.id,
      partnerId: user!.partnerId,
    }));
  }

  /**
   * Verifica se já existe um insight similar no sistema
   * para evitar duplicação de conteúdo
   */
  private async hasSimilarInsight(
    userId: number,
    partnerId: number,
    type: InsightType,
    title: string,
    content: string
  ): Promise<boolean> {
    try {
      // Buscar todos os insights ativos para esse casal
      const existingInsights =
        await this.storage.getPartnerRelationshipInsights(userId, partnerId);
      if (!existingInsights || existingInsights.length === 0) return false;

      // Primeiro verificar por títulos idênticos para o mesmo tipo
      const sameTitleInsights = existingInsights.filter(
        (insight) => insight.insightType === type && insight.title === title
      );

      if (sameTitleInsights.length > 0) return true;

      // Se não encontrou pelo título, verificar similaridade no conteúdo
      // Implementação simplificada - considerar similares se as primeiras 100 caracteres forem iguais
      const contentStart = content.substring(0, 100);
      return existingInsights.some((insight) => {
        if (insight.insightType !== type) return false;
        const existingContentStart = insight.content.substring(0, 100);
        return existingContentStart === contentStart;
      });
    } catch (error) {
      console.error("Erro ao verificar insights similares:", error);
      return false; // Em caso de erro, presumimos que não há similar para continuar o fluxo
    }
  }

  /**
   * Gera insights para um casal específico
   */
  private async generateInsightsForCouple(
    userId: number,
    partnerId: number
  ): Promise<void> {
    try {
      // 1. Collect task distribution data
      const taskDistribution = await this.analyzeTaskDistribution(
        userId,
        partnerId
      );

      // 2. Generate insights based on data
      const insights: InsightGenerationResult[] = [];

      // Task balance insight
      if (taskDistribution) {
        const taskInsight =
          await this.generateTaskDistributionInsight(taskDistribution);

        if (taskInsight && taskInsight.title && taskInsight.content) {
          // Verify if similar insight exists
          const hasSimilar = await this.hasSimilarInsight(
            userId,
            partnerId,
            taskInsight.type,
            taskInsight.title,
            taskInsight.content
          );

          if (!hasSimilar) {
            insights.push(taskInsight);
          } else {
            console.log(
              `Similar insight about ${taskInsight.type} already exists for couple (${userId}, ${partnerId}). Skipping.`
            );
          }
        } else {
          console.warn(
            `Invalid insight generated for couple (${userId}, ${partnerId}): missing title or content`
          );
        }
      }

      // 3. Save valid insights to database
      for (const insight of insights) {
        // Validate required fields
        if (!insight.title || !insight.content) {
          console.error(
            `Skipping invalid insight for couple (${userId}, ${partnerId}): missing required fields`
          );
          continue;
        }

        const insertData: InsertRelationshipInsight = {
          userId,
          partnerId,
          insightType: insight.type,
          title: insight.title,
          content: insight.content,
          sentiment: insight.sentiment || "neutral",
          score: insight.score || 5,
          rawData: insight.rawData,
          metadata: insight.metadata,
          actions: insight.actions || [],
          expiresAt: this.calculateExpirationDate(),
        };

        try {
          await this.storage.createRelationshipInsight(insertData);
        } catch (error) {
          console.error(
            `Error saving insight for couple (${userId}, ${partnerId}):`,
            error
          );
        }
      }

      console.log(
        `Generated ${insights.length} insights for couple (${userId}, ${partnerId})`
      );
    } catch (error) {
      console.error(
        `Error generating insights for couple (${userId}, ${partnerId}):`,
        error
      );
    }
  }

  /**
   * Calcula a data de expiração para um insight (30 dias a partir de agora)
   */
  private calculateExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);
    return expirationDate;
  }

  /**
   * Analisa a distribuição de tarefas entre os parceiros
   */
  private async analyzeTaskDistribution(
    userId: number,
    partnerId: number
  ): Promise<TaskDistributionData | null> {
    try {
      // Obter dados do usuário e parceiro
      const user = await this.storage.getUser(userId);
      const partner = await this.storage.getUser(partnerId);

      if (!user || !partner) {
        console.error("Usuário ou parceiro não encontrado");
        return null;
      }

      // Obter tarefas dos dois usuários
      const userTasks = await this.storage.getUserHouseholdTasks(userId);
      const partnerTasks = await this.storage.getUserHouseholdTasks(partnerId);

      // Categorias de tarefas (simplificado para o MVP)
      const categories: Record<string, { user: number; partner: number }> = {
        limpeza: { user: 0, partner: 0 },
        compras: { user: 0, partner: 0 },
        cozinha: { user: 0, partner: 0 },
        outras: { user: 0, partner: 0 },
      };

      // Contar tarefas por categoria (implementação simplificada)
      // Numa versão completa, analisaríamos o texto das tarefas para categorização
      for (const task of userTasks) {
        if (task.title.toLowerCase().includes("limp")) {
          categories.limpeza.user++;
        } else if (task.title.toLowerCase().includes("compr")) {
          categories.compras.user++;
        } else if (
          task.title.toLowerCase().includes("cozin") ||
          task.title.toLowerCase().includes("comid")
        ) {
          categories.cozinha.user++;
        } else {
          categories.outras.user++;
        }
      }

      for (const task of partnerTasks) {
        if (task.title.toLowerCase().includes("limp")) {
          categories.limpeza.partner++;
        } else if (task.title.toLowerCase().includes("compr")) {
          categories.compras.partner++;
        } else if (
          task.title.toLowerCase().includes("cozin") ||
          task.title.toLowerCase().includes("comid")
        ) {
          categories.cozinha.partner++;
        } else {
          categories.outras.partner++;
        }
      }

      // Calcular estatísticas
      const userCompleted = userTasks.filter((t) => t.completed).length;
      const partnerCompleted = partnerTasks.filter((t) => t.completed).length;

      const now = new Date();
      const userOverdue = userTasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
      ).length;
      const partnerOverdue = partnerTasks.filter(
        (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
      ).length;

      return {
        user: {
          id: userId,
          name: user.name,
          total: userTasks.length,
          completed: userCompleted,
          pending: userTasks.length - userCompleted,
          overdue: userOverdue,
          completionRate:
            userTasks.length > 0 ? userCompleted / userTasks.length : 0,
        },
        partner: {
          id: partnerId,
          name: partner.name,
          total: partnerTasks.length,
          completed: partnerCompleted,
          pending: partnerTasks.length - partnerCompleted,
          overdue: partnerOverdue,
          completionRate:
            partnerTasks.length > 0
              ? partnerCompleted / partnerTasks.length
              : 0,
        },
        categories,
      };
    } catch (error) {
      console.error("Erro ao analisar distribuição de tarefas:", error);
      return null;
    }
  }

  /**
   * Gera um insight sobre distribuição de tarefas usando a API OpenAI ou Perplexity,
   * com fallback para geração local quando as APIs não estão disponíveis
   */
  private async generateTaskDistributionInsight(
    data: TaskDistributionData
  ): Promise<InsightGenerationResult | null> {
    try {
      // Primeiro tentar usar o Perplexity se estiver configurado
      if (perplexityService.isConfigured()) {
        try {
          console.log("Tentando gerar insight com Perplexity API...");
          const perplexityResult =
            await perplexityService.generateTaskDistributionInsight(data);
          if (perplexityResult) {
            console.log("Insight gerado com sucesso usando Perplexity API");
            return perplexityResult;
          }
        } catch (perplexityError) {
          console.warn(
            "Erro na API Perplexity, tentando OpenAI como alternativa:",
            perplexityError instanceof Error
              ? perplexityError.message
              : String(perplexityError)
          );
        }
      }

      // Se Perplexity falhou ou não está configurado, tentar OpenAI
      // Preparar os dados para o prompt
      const userCompletionPercent = Math.round(data.user.completionRate * 100);
      const partnerCompletionPercent = Math.round(
        data.partner.completionRate * 100
      );

      const categoriesData = Object.entries(data.categories)
        .map(([category, counts]) => {
          const total = counts.user + counts.partner;
          const userPercent =
            total > 0 ? Math.round((counts.user / total) * 100) : 0;
          const partnerPercent =
            total > 0 ? Math.round((counts.partner / total) * 100) : 0;
          return `${category}: ${data.user.name} ${userPercent}%, ${data.partner.name} ${partnerPercent}%`;
        })
        .join("\n");

      try {
        // Verificar se a API Key da OpenAI está configurada
        if (!process.env.OPENAI_API_KEY) {
          console.warn(
            "API key da OpenAI não configurada, usando geração local de insights"
          );
          return this.generateTaskDistributionInsightLocally(data);
        }

        // Tentar usar a API OpenAI
        // Construir o prompt para a API OpenAI
        const prompt = `
Você é um consultor de relacionamentos especializado em analisar dinâmicas entre casais.
Analise os seguintes dados sobre a distribuição e conclusão de tarefas domésticas entre um casal:

DADOS DO CASAL:
- ${data.user.name}: ${data.user.total} tarefas totais, ${data.user.completed} concluídas (${userCompletionPercent}%), ${data.user.pending} pendentes, ${data.user.overdue} atrasadas
- ${data.partner.name}: ${data.partner.total} tarefas totais, ${data.partner.completed} concluídas (${partnerCompletionPercent}%), ${data.partner.pending} pendentes, ${data.partner.overdue} atrasadas

DISTRIBUIÇÃO POR CATEGORIA:
${categoriesData}

Com base nesses dados, crie um insight útil e construtivo sobre a dinâmica de distribuição de tarefas do casal. Seu insight deve ser?
1. Personalizado e específico para este casal
2. Respeitoso e construtivo, sem culpar nenhum dos parceiros
3. Focado em identificar padrões e sugerir melhorias para o equilíbrio das tarefas
4. Destacar as vantagens de uma rotina bem organizada em casal, como:
   - Maior tempo de qualidade juntos
   - Redução do estresse e conflitos
   - Sensação de parceria e equidade
   - Melhoria da comunicação e satisfação no relacionamento

Retorne sua análise em formato JSON com os seguintes campos:
- title: um título curto e impactante para o insight (máximo 50 caracteres)
- content: o texto completo do insight (150-200 palavras)
- sentiment: "positive", "negative", ou "neutral" dependendo do tom geral
- score: um número de 1 a 10 indicando a importância/urgência deste insight (10 sendo o mais urgente)
- actions: um array com 2-3 sugestões práticas que o casal pode implementar

Não inclua explicações, apenas o objeto JSON.
`;

        // Chamada à API OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "Você é um assistente especializado em insights de relacionamento com base em dados.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
        });

        const responseContent = response.choices[0].message.content;
        if (!responseContent) {
          throw new Error("Resposta vazia da API OpenAI");
        }

        // Analisar o resultado da API
        const result = JSON.parse(responseContent);

        return {
          type: InsightType.TASK_BALANCE,
          title: result.title,
          content: result.content,
          sentiment: result.sentiment,
          score: result.score,
          actions: result.actions,
          rawData: data,
        };
      } catch (apiError) {
        const errorMessage =
          apiError instanceof Error ? apiError.message : String(apiError);
        console.warn(
          "Erro na API OpenAI, usando geração local de insights:",
          errorMessage
        );

        // Fallback: Gerar insights localmente quando a API não está disponível
        return this.generateTaskDistributionInsightLocally(data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        "Erro ao gerar insight de distribuição de tarefas:",
        errorMessage
      );
      return null;
    }
  }

  /**
   * Gera um insight sobre distribuição de tarefas localmente (sem depender da API OpenAI)
   * Usado como fallback quando a API não está disponível
   */
  private generateTaskDistributionInsightLocally(
    data: TaskDistributionData
  ): InsightGenerationResult {
    // Análise básica dos dados
    const userCompletionPercent = Math.round(data.user.completionRate * 100);
    const partnerCompletionPercent = Math.round(
      data.partner.completionRate * 100
    );
    const totalTasks = data.user.total + data.partner.total;

    // Verificar se há desequilíbrio na distribuição de tarefas
    const userTaskPercent =
      totalTasks > 0 ? Math.round((data.user.total / totalTasks) * 100) : 50;
    const partnerTaskPercent =
      totalTasks > 0 ? Math.round((data.partner.total / totalTasks) * 100) : 50;
    const taskDistributionDiff = Math.abs(userTaskPercent - partnerTaskPercent);

    // Verificar diferença nas taxas de conclusão
    const completionRateDiff = Math.abs(
      userCompletionPercent - partnerCompletionPercent
    );

    // Determinar o sentimento com base nas análises
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    let score = 5;
    let title = "";
    let content = "";
    let actions: string[] = [];

    // Análise da distribuição de tarefas
    if (taskDistributionDiff > 30) {
      // Grande desequilíbrio na quantidade de tarefas
      sentiment = "negative";
      score = 8;

      const personWithMoreTasks =
        userTaskPercent > partnerTaskPercent
          ? data.user.name
          : data.partner.name;
      const personWithFewerTasks =
        userTaskPercent > partnerTaskPercent
          ? data.partner.name
          : data.user.name;

      title = "Equilibrando Tarefas para um Relacionamento Harmonioso";
      content = `A análise mostra um desequilíbrio significativo na distribuição de tarefas entre ${data.user.name} e ${data.partner.name}. Atualmente, ${personWithMoreTasks} está responsável por cerca de ${Math.max(userTaskPercent, partnerTaskPercent)}% das tarefas, enquanto ${personWithFewerTasks} cuida de aproximadamente ${Math.min(userTaskPercent, partnerTaskPercent)}%. 
      
Este desequilíbrio pode levar a sentimentos de sobrecarga e ressentimento ao longo do tempo. Estudos mostram que casais com distribuição mais equilibrada de responsabilidades domésticas reportam maior satisfação no relacionamento e melhor qualidade de vida.

Equilibrar as tarefas trará benefícios significativos: mais tempo de qualidade juntos, redução do estresse diário, maior sensação de parceria e equidade, além de melhorar a comunicação entre vocês. Considere revisar juntos a lista de tarefas e discutir como redistribuí-las de forma mais equitativa, transformando este aspecto em um fortalecedor do relacionamento.`;

      actions = [
        `Realizar uma revisão semanal das tarefas domésticas para garantir uma distribuição mais equilibrada`,
        `${personWithFewerTasks} pode assumir mais responsabilidades nas categorias onde a disparidade é maior`,
        `Considerar a criação de um rodízio de tarefas para alternar responsabilidades periodicamente`,
      ];
    } else if (completionRateDiff > 30) {
      // Grande diferença nas taxas de conclusão
      sentiment = "negative";
      score = 7;

      const personWithHigherCompletion =
        userCompletionPercent > partnerCompletionPercent
          ? data.user.name
          : data.partner.name;
      const personWithLowerCompletion =
        userCompletionPercent > partnerCompletionPercent
          ? data.partner.name
          : data.user.name;
      const lowerCompletionRate = Math.min(
        userCompletionPercent,
        partnerCompletionPercent
      );

      title = "Sincronizando o Ritmo do Casal";
      content = `Existe uma diferença significativa entre vocês na conclusão das tarefas agendadas. Enquanto ${personWithHigherCompletion} completa a maioria das suas tarefas, ${personWithLowerCompletion} está concluindo apenas cerca de ${lowerCompletionRate}% das responsabilidades atribuídas.

Esta disparidade pode criar frustração e afetar a dinâmica do relacionamento. Casais que conseguem sincronizar seu ritmo de conclusão de tarefas tendem a ter mais tempo livre juntos e menos conflitos sobre responsabilidades.

Melhorar este aspecto pode trazer mais harmonia para a rotina, reduzir o estresse e aumentar o tempo de qualidade disponível para vocês. Considere uma conversa aberta e sem julgamentos para identificar possíveis soluções que transformarão esta situação em uma oportunidade de fortalecer a parceria.`;

      actions = [
        `Identificar e discutir os obstáculos que estão dificultando a conclusão das tarefas`,
        `Ajustar a distribuição considerando a disponibilidade e as preferências de cada um`,
        `Criar um sistema simples de lembretes ou check-ins para acompanhar o progresso juntos`,
      ];
    } else if (data.user.overdue > 3 || data.partner.overdue > 3) {
      // Tarefas atrasadas acumulando
      sentiment = "negative";
      score = 6;

      const personWithMoreOverdue =
        data.user.overdue > data.partner.overdue
          ? data.user.name
          : data.partner.name;
      const overdueCount = Math.max(data.user.overdue, data.partner.overdue);

      title = "Transformando Pendências em Oportunidades";
      content = `Notamos que há várias tarefas atrasadas se acumulando, com ${personWithMoreOverdue} tendo atualmente ${overdueCount} tarefas que ultrapassaram o prazo previsto.

O acúmulo de tarefas pendentes pode criar estresse adicional e afetar a qualidade do tempo que vocês passam juntos. Resolver estas pendências pode liberar energia mental e emocional para investir no relacionamento.

Casais que mantêm uma rotina organizada e em dia relatam maior satisfação no relacionamento, melhor comunicação e mais tempo de qualidade juntos. Trabalhar em equipe para resolver estas pendências pode fortalecer o senso de parceria e criar um ambiente mais leve e harmonioso para ambos.`;

      actions = [
        `Revisar a lista de tarefas atrasadas e eliminar as que não são mais necessárias`,
        `Criar um plano específico para colocar em dia as tarefas pendentes mais importantes`,
        `Ajustar expectativas de prazos para serem mais realistas com a rotina de ambos`,
      ];
    } else if (
      taskDistributionDiff < 10 &&
      completionRateDiff < 15 &&
      userCompletionPercent > 70 &&
      partnerCompletionPercent > 70
    ) {
      // Situação positiva - boa distribuição e alta taxa de conclusão
      sentiment = "positive";
      score = 3;

      title = "Equilíbrio e Harmonia na Rotina do Casal";
      content = `Parabéns! A análise mostra que vocês têm conseguido manter um excelente equilíbrio na distribuição das tarefas domésticas, com ${data.user.name} cuidando de ${userTaskPercent}% e ${data.partner.name} responsável por ${partnerTaskPercent}% das tarefas.

Além disso, ambos estão mantendo altas taxas de conclusão: ${data.user.name} com ${userCompletionPercent}% e ${data.partner.name} com ${partnerCompletionPercent}%, o que demonstra comprometimento e organização.

Esta colaboração equilibrada traz benefícios significativos para o relacionamento: mais tempo de qualidade juntos, redução do estresse diário, maior sensação de parceria e equidade, além de melhorar a comunicação entre vocês. Uma rotina bem estruturada e compartilhada como a que vocês mantêm é um dos pilares de relacionamentos duradouros e felizes. Continuem com este excelente trabalho!`;

      actions = [
        `Celebrar juntos o bom funcionamento da parceria e aproveitar o tempo extra de qualidade`,
        `Reservar momentos específicos para atividades a dois aproveitando a boa organização`,
        `Compartilhar entre amigos as estratégias que fazem a rotina de vocês funcionar tão bem`,
      ];
    } else {
      // Situação neutra - nem muito positiva nem muito negativa
      sentiment = "neutral";
      score = 5;

      title = "Potencial para Aprimorar a Rotina do Casal";
      content = `A análise da distribuição de tarefas entre ${data.user.name} e ${data.partner.name} mostra que vocês têm um sistema que funciona razoavelmente bem, com ${data.user.name} gerenciando ${userTaskPercent}% das tarefas e ${data.partner.name} cuidando de ${partnerTaskPercent}%.

As taxas de conclusão são de ${userCompletionPercent}% para ${data.user.name} e ${partnerCompletionPercent}% para ${data.partner.name}, o que indica um nível moderado de eficiência.

Com alguns ajustes, vocês podem transformar esta rotina em uma fonte de maior harmonia no relacionamento. Casais que mantêm uma rotina bem organizada relatam menor estresse diário, mais tempo de qualidade juntos e melhor comunicação. Uma distribuição equilibrada de tarefas também fortalece o senso de parceria e equidade, criando um ambiente onde ambos se sentem valorizados e respeitados.`;

      actions = [
        `Realizar uma conversa sincera sobre como a divisão atual de tarefas está impactando o tempo livre de vocês`,
        `Identificar juntos quais tarefas poderiam ser redistribuídas para liberar mais tempo de qualidade`,
        `Criar rituais semanais para celebrar o progresso e aproveitar os momentos livres como casal`,
      ];
    }

    // Analisar categorias com maior desequilíbrio
    let categoriesWithHighestImbalance: string[] = [];
    Object.entries(data.categories).forEach(([category, counts]) => {
      const total = counts.user + counts.partner;
      if (total >= 3) {
        // Apenas categorias com número significativo de tarefas
        const userPercent =
          total > 0 ? Math.round((counts.user / total) * 100) : 0;
        const partnerPercent =
          total > 0 ? Math.round((counts.partner / total) * 100) : 0;
        if (Math.abs(userPercent - partnerPercent) > 60) {
          // Grande desequilíbrio
          categoriesWithHighestImbalance.push(category);
        }
      }
    });

    // Adicionar menção específica às categorias com maior desequilíbrio
    if (categoriesWithHighestImbalance.length > 0) {
      const categoriesText = categoriesWithHighestImbalance.join(", ");
      const additionalContent = `\n\nObservamos um desequilíbrio significativo nas seguintes categorias: ${categoriesText}. Considerar uma redistribuição nestas áreas específicas pode ser um bom ponto de partida.`;

      content += additionalContent;
    }

    return {
      type: InsightType.TASK_BALANCE,
      title,
      content,
      sentiment,
      score,
      actions,
      rawData: data,
      metadata: {
        generatedLocally: true,
        taskDistributionDiff,
        completionRateDiff,
        categoriesWithHighestImbalance,
      },
    };
  }

  /**
   * Gera um insight baseado em eventos e tempo de qualidade
   * (implementação para uma versão futura)
   */
  private async generateQualityTimeInsight(
    userId: number,
    partnerId: number
  ): Promise<InsightGenerationResult | null> {
    // Esta é uma versão simplificada para o MVP
    // Em uma implementação completa, analisaríamos eventos compartilhados, tipos,
    // frequência, cancelamentos, etc.
    return null;
  }

  /**
   * Gera um insight baseado em comunicação
   * (implementação para uma versão futura)
   */
  private async generateCommunicationInsight(
    userId: number,
    partnerId: number
  ): Promise<InsightGenerationResult | null> {
    // Esta é uma versão simplificada para o MVP
    // Em uma implementação completa, analisaríamos mensagens, padrões de resposta,
    // tom emocional, etc.
    return null;
  }
}
