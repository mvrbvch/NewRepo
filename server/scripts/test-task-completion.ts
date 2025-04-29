// Script para testar o sistema de histórico de conclusão de tarefas
import { db } from "../db";
import { householdTasks, taskCompletionHistory } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { formatDateSafely } from "../utils";
import { UnifiedRecurrenceService } from "../services/UnifiedRecurrenceService";

async function main() {
  console.log("Iniciando teste de histórico de conclusão de tarefas...");
  
  try {
    // 1. Verificar se existe pelo menos uma tarefa no banco de dados
    const existingTasks = await db.select().from(householdTasks).limit(1);
    let taskId: number;
    
    if (existingTasks.length === 0) {
      console.log("Nenhuma tarefa encontrada. Criando uma tarefa de teste...");
      // Criar uma tarefa de teste
      const [newTask] = await db.insert(householdTasks).values({
        title: "Tarefa de teste para histórico",
        description: "Tarefa criada para testar o sistema de histórico de conclusão",
        frequency: "daily",
        createdBy: 1,
        assignedTo: 1,
        completed: false,
        createdAt: new Date(),
        position: 1
      }).returning();
      
      taskId = newTask.id;
      console.log(`Tarefa de teste criada com ID: ${taskId}`);
    } else {
      taskId = existingTasks[0].id;
      console.log(`Usando tarefa existente com ID: ${taskId}`);
      
      // Resetar a tarefa para não concluída para o teste
      await db.update(householdTasks)
        .set({ completed: false, completedAt: null })
        .where(eq(householdTasks.id, taskId));
      console.log("Tarefa resetada para não concluída");
    }
    
    // 2. Marcar a tarefa como concluída
    console.log("Marcando tarefa como concluída...");
    const userId = 1; // Usando ID 1 para o teste
    const now = new Date();
    
    // Obter a tarefa atual
    const [task] = await db.select().from(householdTasks).where(eq(householdTasks.id, taskId));
    
    if (!task) {
      throw new Error(`Tarefa com ID ${taskId} não encontrada`);
    }
    
    // Calcular a próxima data de vencimento
    let nextDueDate = null;
    if (task.frequency !== "never" && task.frequency !== "once") {
      nextDueDate = UnifiedRecurrenceService.calculateNextDueDateForTask(task);
    }
    
    // Atualizar a tarefa
    const [updatedTask] = await db.update(householdTasks)
      .set({ 
        completed: true, 
        completedAt: now,
        nextDueDate: nextDueDate
      })
      .where(eq(householdTasks.id, taskId))
      .returning();
    
    console.log("Tarefa marcada como concluída:", {
      id: updatedTask.id,
      title: updatedTask.title,
      completedAt: formatDateSafely(updatedTask.completedAt),
      nextDueDate: updatedTask.nextDueDate ? formatDateSafely(updatedTask.nextDueDate) : null
    });
    
    // 3. Adicionar registro no histórico de conclusão
    const [historyRecord] = await db.insert(taskCompletionHistory)
      .values({
        taskId: taskId,
        userId: userId,
        completedDate: now,
        expectedDate: task.dueDate,
        isCompleted: true,
        createdAt: now
      })
      .returning();
    
    console.log("Registro de histórico de conclusão adicionado:", {
      id: historyRecord.id,
      taskId: historyRecord.taskId,
      userId: historyRecord.userId,
      completedDate: formatDateSafely(historyRecord.completedDate),
      expectedDate: historyRecord.expectedDate ? formatDateSafely(historyRecord.expectedDate) : null
    });
    
    // 4. Buscar o histórico de conclusão da tarefa
    const history = await db.select().from(taskCompletionHistory)
      .where(eq(taskCompletionHistory.taskId, taskId))
      .orderBy(taskCompletionHistory.completedDate);
    
    console.log(`Histórico de conclusão para a tarefa ${taskId}:`);
    history.forEach((record, index) => {
      console.log(`${index + 1}. Concluída em: ${formatDateSafely(record.completedDate)} por usuário ${record.userId}`);
    });
    
    // 5. Marcar a tarefa como não concluída
    console.log("\nMarcando tarefa como não concluída...");
    
    const [uncompletedTask] = await db.update(householdTasks)
      .set({ 
        completed: false, 
        completedAt: null
      })
      .where(eq(householdTasks.id, taskId))
      .returning();
    
    console.log("Tarefa marcada como não concluída:", {
      id: uncompletedTask.id,
      title: uncompletedTask.title,
      completed: uncompletedTask.completed,
      completedAt: uncompletedTask.completedAt
    });
    
    console.log("\nTeste de histórico de conclusão de tarefas concluído com sucesso!");
    
  } catch (error) {
    console.error("Erro durante o teste:", error);
  } finally {
    // Fechar a conexão com o banco de dados
    // Não precisamos fechar a conexão, pois o pool gerencia isso automaticamente
  }
}

main().catch(console.error);