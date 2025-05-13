import express, { Request, Response } from "express";
import { IStorage } from "./storage";
import {
  InsightType,
  RelationshipInsightsService,
} from "./relationshipInsightsService";
import { z } from "zod";

/**
 * Configura as rotas para o sistema de insights de relacionamento
 */
export function setupRelationshipInsightsRoutes(
  app: express.Express,
  storage: IStorage
) {
  const insightsService = new RelationshipInsightsService(storage);

  // Iniciar o serviço de insights
  insightsService.start();

  /**
   * Obter todos os insights do usuário
   */
  app.get("/api/relationship-insights", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const userId = (req.user as any).id;
      console.log("Buscando insights para usuário:", userId);
      const insights = await storage.getUserRelationshipInsights(userId);

      return res.json(insights);
    } catch (error) {
      console.error("Erro ao obter insights de relacionamento:", error);
      return res
        .status(500)
        .json({ error: "Erro ao obter insights de relacionamento" });
    }
  });

  /**
   * Obter insights entre usuário e parceiro
   */
  app.get(
    "/api/relationship-insights/partner",
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const userId = (req.user as any).id;
        const user = await storage.getUser(userId);

        if (!user || !user.partnerId) {
          return res.status(400).json({ error: "Usuário não tem um parceiro" });
        }

        const insights = await storage.getPartnerRelationshipInsights(
          userId,
          user.partnerId
        );

        return res.json(insights);
      } catch (error) {
        console.error("Erro ao obter insights do casal:", error);
        return res
          .status(500)
          .json({ error: "Erro ao obter insights do casal" });
      }
    }
  );

  /**
   * Obter insight específico por ID
   */
  app.get(
    "/api/relationship-insights/:id",
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const userId = (req.user as any).id;
        const insightId = parseInt(req.params.id);

        if (isNaN(insightId)) {
          return res.status(400).json({ error: "ID de insight inválido" });
        }

        const insight = await storage.getRelationshipInsight(insightId);

        if (!insight) {
          return res.status(404).json({ error: "Insight não encontrado" });
        }

        // Verificar se o usuário tem permissão para ver este insight
        if (insight.userId !== userId && insight.partnerId !== userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }

        return res.json(insight);
      } catch (error) {
        console.error("Erro ao obter insight:", error);
        return res.status(500).json({ error: "Erro ao obter insight" });
      }
    }
  );

  /**
   * Marcar insight como lido
   */
  app.post(
    "/api/relationship-insights/:id/read",
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const userId = (req.user as any).id;
        const insightId = parseInt(req.params.id);

        if (isNaN(insightId)) {
          return res.status(400).json({ error: "ID de insight inválido" });
        }

        const insight = await storage.getRelationshipInsight(insightId);

        if (!insight) {
          return res.status(404).json({ error: "Insight não encontrado" });
        }

        // Verificar se o usuário tem permissão para marcar este insight como lido
        const isUser = insight.userId === userId;
        const isPartner = insight.partnerId === userId;

        if (!isUser && !isPartner) {
          return res.status(403).json({ error: "Acesso negado" });
        }

        // Marcar o insight como lido pelo usuário ou parceiro
        const updatedInsight = await storage.markInsightAsRead(
          insightId,
          isUser
        );

        return res.json(updatedInsight);
      } catch (error) {
        console.error("Erro ao marcar insight como lido:", error);
        return res
          .status(500)
          .json({ error: "Erro ao marcar insight como lido" });
      }
    }
  );

  /**
   * Excluir insight
   */
  app.delete(
    "/api/relationship-insights/:id",
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const userId = (req.user as any).id;
        const insightId = parseInt(req.params.id);

        if (isNaN(insightId)) {
          return res.status(400).json({ error: "ID de insight inválido" });
        }

        const insight = await storage.getRelationshipInsight(insightId);

        if (!insight) {
          return res.status(404).json({ error: "Insight não encontrado" });
        }

        // Verificar se o usuário tem permissão para excluir este insight
        if (insight.userId !== userId && insight.partnerId !== userId) {
          return res.status(403).json({ error: "Acesso negado" });
        }

        const deleted = await storage.deleteRelationshipInsight(insightId);

        if (!deleted) {
          return res.status(500).json({ error: "Erro ao excluir insight" });
        }

        return res.json({ success: true });
      } catch (error) {
        console.error("Erro ao excluir insight:", error);
        return res.status(500).json({ error: "Erro ao excluir insight" });
      }
    }
  );

  /**
   * Gerar insight manual (para testes e demonstrações)
   * Esta rota seria removida em produção
   */
  app.post(
    "/api/relationship-insights/generate",
    async (req: Request, res: Response) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ error: "Usuário não autenticado" });
        }

        const userId = (req.user as any).id;
        const user = await storage.getUser(userId);

        if (!user || !user.partnerId) {
          return res.status(400).json({ error: "Usuário não tem um parceiro" });
        }

        // Esquema de validação para o corpo da requisição
        const schema = z.object({
          type: z
            .enum([
              InsightType.TASK_BALANCE,
              InsightType.COMMUNICATION,
              InsightType.QUALITY_TIME,
              InsightType.RELATIONSHIP_GOALS,
              InsightType.HABITS,
              InsightType.SPECIAL_DATES,
              InsightType.GENERAL,
            ])
            .optional(),
        });

        const parseResult = schema.safeParse(req.body);

        if (!parseResult.success) {
          return res
            .status(400)
            .json({ error: "Dados inválidos", details: parseResult.error });
        }

        // Chamar método privado do serviço
        // Em uma implementação real, teríamos um método público para isso
        // ou implementaríamos um mecanismo alternativo para geração manual
        const generateMethod = (insightsService as any)
          .generateInsightsForCouple;

        if (typeof generateMethod !== "function") {
          return res
            .status(500)
            .json({ error: "Método de geração não disponível" });
        }

        // Verificar se já existem insights recentes (últimas 24 horas) para evitar duplicação
        const existingInsights = await storage.getPartnerRelationshipInsights(
          userId,
          user.partnerId
        );

        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Filtra insights criados nas últimas 24 horas
        const recentInsights = existingInsights.filter((insight) => {
          const createdAt =
            insight.createdAt instanceof Date
              ? insight.createdAt
              : new Date(insight.createdAt as string);
          return createdAt > oneDayAgo;
        });

        if (recentInsights.length > 0) {
          // Se já existem insights recentes, retornar eles sem gerar novos
          console.log(
            `Encontrados ${recentInsights.length} insights recentes para o casal (${userId}, ${user.partnerId}). Pulando geração.`
          );
          return res.json(recentInsights);
        }

        // Se não existem insights recentes, gerar novos
        await generateMethod.call(insightsService, userId, user.partnerId);

        // Buscar insights atualizados
        const insights = await storage.getPartnerRelationshipInsights(
          userId,
          user.partnerId
        );

        return res.json(insights);
      } catch (error) {
        console.error("Erro ao gerar insight manualmente:", error);
        return res.status(500).json({ error: "Erro ao gerar insight" });
      }
    }
  );
}
