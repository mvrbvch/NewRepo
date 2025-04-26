import { Request, Response, Router } from "express";
import { db } from "../db";
import { eventCategories, insertEventCategorySchema } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Obter todas as categorias do usuário (incluindo as compartilhadas pelo parceiro)
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const userCategoriesQuery = await db
      .select()
      .from(eventCategories)
      .where(
        eq(eventCategories.userId, req.session.userId)
      );
    
    // Obter informações do parceiro, se existir
    const userData = await db.query.users.findFirst({
      where: eq(db.query.users.id, req.session.userId),
      columns: {
        partnerId: true
      }
    });
    
    let partnerCategories: typeof userCategoriesQuery = [];
    
    // Se tiver parceiro, buscar categorias compartilhadas
    if (userData?.partnerId) {
      partnerCategories = await db
        .select()
        .from(eventCategories)
        .where(
          and(
            eq(eventCategories.userId, userData.partnerId),
            eq(eventCategories.isShared, true)
          )
        );
    }
    
    // Combinar categorias do usuário com as do parceiro
    const allCategories = [...userCategoriesQuery, ...partnerCategories];
    
    res.json(allCategories);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

// Criar nova categoria
router.post("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    // Validar os dados recebidos
    const categoryData = {
      ...req.body,
      userId: req.session.userId
    };
    
    const parsedData = insertEventCategorySchema.safeParse(categoryData);
    
    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.flatten() });
    }
    
    // Inserir a nova categoria
    const result = await db
      .insert(eventCategories)
      .values(parsedData.data)
      .returning();
    
    if (result.length === 0) {
      return res.status(500).json({ error: "Erro ao criar categoria" });
    }
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ error: "Erro ao criar categoria" });
  }
});

// Atualizar categoria existente
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "ID de categoria inválido" });
    }
    
    // Verificar se a categoria pertence ao usuário
    const existingCategory = await db.query.eventCategories.findFirst({
      where: and(
        eq(eventCategories.id, categoryId),
        eq(eventCategories.userId, req.session.userId)
      )
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: "Categoria não encontrada ou não pertence ao usuário" });
    }
    
    // Validar os dados da atualização
    const updateSchema = z.object({
      name: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      isShared: z.boolean().optional()
    });
    
    const parsedData = updateSchema.safeParse(req.body);
    
    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.flatten() });
    }
    
    // Atualizar a categoria
    const result = await db
      .update(eventCategories)
      .set(parsedData.data)
      .where(
        and(
          eq(eventCategories.id, categoryId),
          eq(eventCategories.userId, req.session.userId)
        )
      )
      .returning();
    
    if (result.length === 0) {
      return res.status(500).json({ error: "Erro ao atualizar categoria" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

// Excluir categoria
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Não autorizado" });
    }
    
    const categoryId = parseInt(req.params.id);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "ID de categoria inválido" });
    }
    
    // Verificar se a categoria pertence ao usuário
    const existingCategory = await db.query.eventCategories.findFirst({
      where: and(
        eq(eventCategories.id, categoryId),
        eq(eventCategories.userId, req.session.userId)
      )
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: "Categoria não encontrada ou não pertence ao usuário" });
    }
    
    // Remover a categoria dos eventos que a utilizam antes de excluí-la
    await db
      .update(db.query.events)
      .set({ categoryId: null })
      .where(eq(db.query.events.categoryId, categoryId));
    
    // Excluir a categoria
    await db
      .delete(eventCategories)
      .where(
        and(
          eq(eventCategories.id, categoryId),
          eq(eventCategories.userId, req.session.userId)
        )
      );
    
    res.json({ success: true, message: "Categoria excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir categoria:", error);
    res.status(500).json({ error: "Erro ao excluir categoria" });
  }
});

export default router;