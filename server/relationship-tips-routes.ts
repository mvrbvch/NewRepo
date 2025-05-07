import express from "express";
import { storage } from "./storage";
import {
  RelationshipTipsService,
  TipCategory,
} from "./relationshipTipsService";
import {
  sendPushToUser,
  sendPushToDevice,
  PushNotificationPayload,
} from "./pushNotifications";

const router = express.Router();
const tipService = new RelationshipTipsService(storage);

// Gerar uma nova dica de relacionamento
router.post("/api/tips/generate", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);

    if (!user || !user.partnerId) {
      return res.status(400).json({ error: "Usuário não tem um parceiro" });
    }

    const partnerId = user.partnerId;
    const { category, customPrompt, contextData } = req.body;

    if (!userId || !partnerId) {
      return res
        .status(400)
        .json({ error: "Usuário e parceiro são obrigatórios" });
    }

    // Verificar se a categoria é válida, se fornecida
    if (category && !Object.values(TipCategory).includes(category)) {
      return res.status(400).json({ error: "Categoria inválida" });
    }

    const tip = await tipService.generateTip({
      userId,
      partnerId,
      category,
      customPrompt,
      contextData,
    });

    if (!tip) {
      return res.status(500).json({ error: "Não foi possível gerar uma dica" });
    }

    res.json(tip);
  } catch (error) {
    console.error("Erro ao gerar dica:", error);
    res.status(500).json({ error: "Erro ao gerar dica de relacionamento" });
  }
});

// Obter todas as dicas de um usuário
router.get("/api/tips/user", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const userId = parseInt((req.user as any).id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const tips = await storage.getUserRelationshipTips(userId);
    res.json(tips);
  } catch (error) {
    console.error("Erro ao buscar dicas do usuário:", error);
    res.status(500).json({ error: "Erro ao buscar dicas de relacionamento" });
  }
});
// Obter dicas favoritas de um usuário
router.get("/api/tips/favorites", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }
    const userId = (req.user as any).id;

    if (isNaN(userId)) {
      return res.status(400).json({ error: "ID de usuário inválido" });
    }

    const tips = await storage.getSavedRelationshipTips(userId);
    res.json(tips);
  } catch (error) {
    console.error("Erro ao buscar dicas favoritas:", error);
    res
      .status(500)
      .json({ error: "Erro ao buscar dicas de relacionamento favoritas" });
  }
});
// Obter dicas de um casal
router.get("/api/tips/couple/:partnerId", async (req, res) => {
  try {
    const userId = parseInt(String(req?.user?.id));
    const partnerId = parseInt(req.params.partnerId);

    if (isNaN(userId) || isNaN(partnerId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }

    const tips = await storage.getPartnerRelationshipTips(userId, partnerId);
    res.json(tips);
  } catch (error) {
    console.error("Erro ao buscar dicas do casal:", error);
    res.status(500).json({ error: "Erro ao buscar dicas de relacionamento" });
  }
});

// Obter uma dica específica
router.get("/api/tips/:id", async (req, res) => {
  try {
    const tipId = parseInt(req.params.id);

    if (isNaN(tipId)) {
      return res.status(400).json({ error: "ID de dica inválido" });
    }

    const tip = await storage.getRelationshipTip(tipId);

    if (!tip) {
      return res.status(404).json({ error: "Dica não encontrada" });
    }

    res.json(tip);
  } catch (error) {
    console.error("Erro ao buscar dica:", error);
    res.status(500).json({ error: "Erro ao buscar dica de relacionamento" });
  }
});

// Salvar uma dica nos favoritos
router.post("/api/tips/:id/favorite", async (req, res) => {
  try {
    const tipId = parseInt(req.params.id);

    if (isNaN(tipId)) {
      return res
        .status(400)
        .json({ error: "ID da dica tá errado, confere aí!" });
    }

    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);

    if (!user || !user.partnerId) {
      return res
        .status(400)
        .json({ error: "Você não tem um parceiro cadastrado!" });
    }

    const success = await tipService.saveTipToFavorites(tipId);

    if (!success) {
      return res
        .status(404)
        .json({ error: "Dica não encontrada ou deu ruim ao salvar!" });
    }

    // Buscar a dica favoritada para incluir o resumo na notificação
    const tip = await storage.getRelationshipTip(tipId);

    if (!tip) {
      return res.status(404).json({ error: "Dica não encontrada!" });
    }

    // Enviar push notification ao parceiro
    try {
      const partner = await storage.getUser(user.partnerId);

      if (partner) {
        const pushPayload = {
          title: "Olha só, novidade!",
          body: `${user.name} favoritou uma dica: "${tip.title || tip.content.slice(0, 100)}..."`,
          data: {
            type: "favorite-tip",
            tipId,
          },
        };

        const sentCount = await sendPushToUser(partner.id, pushPayload);

        console.log(
          `Notificação enviada para ${partner.name}! Total de notificações: ${sentCount}`
        );
      }
    } catch (pushError) {
      console.error("Deu ruim ao enviar a notificação push:", pushError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar dica como favorita:", error);
    res.status(500).json({ error: "Erro ao atualizar dica de relacionamento" });
  }
});

// Remover uma dica dos favoritos
router.post("/api/tips/:id/unfavorite", async (req, res) => {
  try {
    const tipId = parseInt(req.params.id);

    if (isNaN(tipId)) {
      return res.status(400).json({ error: "ID de dica inválido" });
    }

    const success = await tipService.removeFromFavorites(tipId);

    if (!success) {
      return res
        .status(404)
        .json({ error: "Dica não encontrada ou erro ao remover" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover dica dos favoritos:", error);
    res.status(500).json({ error: "Erro ao atualizar dica de relacionamento" });
  }
});

// Excluir uma dica
router.delete("/api/tips/:id", async (req, res) => {
  try {
    const tipId = parseInt(req.params.id);

    if (isNaN(tipId)) {
      return res.status(400).json({ error: "ID de dica inválido" });
    }

    const success = await storage.deleteRelationshipTip(tipId);

    if (!success) {
      return res
        .status(404)
        .json({ error: "Dica não encontrada ou erro ao excluir" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir dica:", error);
    res.status(500).json({ error: "Erro ao excluir dica de relacionamento" });
  }
});

export default router;
