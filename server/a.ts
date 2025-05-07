import { storage } from "../server/storage";
import { addDays } from "date-fns";
import dotenv from "dotenv";
dotenv.config();

// Helper function to randomly assign a user ID
function getRandomUserId(userId1: string, userId2: string): string {
  return Math.random() > 0.5 ? userId1 : userId2;
}
// Main function to seed household tasks
async function seedHouseholdTasks() {
  try {
    // Fetch existing user IDs
    const user1 = await storage.getUserByEmail("jucustodio15@gmail.com");
    const user2 = await storage.getUserByEmail("matheus@murbach.work");

    const userId1 = Number(user1?.id);
    const userId2 = Number(user2?.id);

    if (!userId1 || !userId2) {
      throw new Error("Usuários não encontrados");
    }

    const householdTasks = [
      {
        title: "Limpar e organizar cômoda",
        description: "Cômodo 1 - Quarto de casal",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1, // Média prioridade
      },
      {
        title: "Tirar pó e organizar mesa do trabalho",
        description: "Cômodo 1 - Quarto de casal",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2, // Alta prioridade
      },
      {
        title: "Limpar as portas do guarda roupas",
        description: "Cômodo 1 - Quarto de casal",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0, // Baixa prioridade
      },
      {
        title: "Guardar o resto das roupas no guarda roupas",
        description: "Cômodo 2 - Escritório",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Organizar e limpar mesa do Matheus",
        description: "Cômodo 2 - Escritório",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2,
      },
      {
        title: "Limpar portas do guarda roupas",
        description: "Cômodo 2 - Escritório",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0,
      },
      {
        title: "Limpar estante de suprimentos",
        description: "Cômodo 5 - Copa",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Tirar comidas antigas da geladeira para jogar fora",
        description: "Cômodo 6 - Cozinha",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2,
      },
      {
        title: "Limpar a geladeira e microondas",
        description: "Cômodo 6 - Cozinha",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Limpar os móveis e organizar a cozinha",
        description: "Cômodo 6 - Cozinha",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0,
      },
      {
        title: "Lavar banheiros",
        description: "Cômodo 7 - Banheiros",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2,
      },
      {
        title: "Limpar prateleira",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Guardar todas as roupas",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0,
      },
      {
        title: "Limpar mesas de trabalho",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2,
      },
      {
        title: "Limpar as portas",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Limpar janelas",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0,
      },
      {
        title: "Arrumar as caixas do guarda roupa branco",
        description: "Tarefas gerais",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },
      {
        title: "Limpar e arrumar ventiladores",
        description: "Tarefas gerais",
        category: "maintenance",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 2,
      },
      {
        title: "Limpar tanque de roupas",
        description: "Cômodo 6 - Cozinha",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 0,
      },
      {
        title: "Limpar armário cozinha",
        description: "Cômodo 6 - Cozinha",
        category: "cleaning",
        frequency: "daily",
        recurrenceRule: "daily",
        priority: 1,
      },

      {
        title: "Lavar roupas",
        description: "Tarefa semanal",
        category: "cleaning",
        frequency: "weekly",
        recurrenceRule: "weekly",
        priority: 2,
      },
      {
        title: "Limpar o quintal",
        description: "Tarefa semanal",
        category: "cleaning",
        frequency: "weekly",
        recurrenceRule: "weekly",
        priority: 1,
      },
      {
        title: "Organizar a despensa",
        description: "Tarefa semanal",
        category: "cleaning",
        frequency: "weekly",
        recurrenceRule: "weekly",
        priority: 0,
      },
    ];

    console.log("Iniciando criação de tarefas diárias...");

    // Create daily tasks
    for (const tarefa of householdTasks) {
      if (tarefa.frequency === "daily") {
        const createdBy = getRandomUserId(userId1, userId2);
        const assignedTo = createdBy === userId1 ? userId2 : userId1;

        const task = await storage.createHouseholdTask({
          title: tarefa.title,
          description: tarefa.description,
          frequency: tarefa.frequency,
          createdBy: Number(createdBy),
          assignedTo,
          dueDate: null, // No specific due date for daily tasks
          completed: false,
          category: tarefa.category,
          priority: tarefa.priority,
          recurrenceRule: "FREQ=DAILY",
        });
      }

      if (tarefa.frequency === "weekly") {
        const createdBy = getRandomUserId(userId1, userId2);
        const assignedTo = createdBy === userId1 ? userId2 : userId1;

        // Set due date to the next Sunday
        const today = new Date();
        const daysUntilSunday = 7 - today.getDay();
        const dueDate = addDays(today, daysUntilSunday);

        const task = await storage.createHouseholdTask({
          title: tarefa.title,
          description: `Tarefa semanal: ${tarefa.title}`,
          frequency: "weekly",
          createdBy,
          assignedTo,
          dueDate,
          completed: false,
          category: tarefa.category,
          priority: tarefa.priority,
          recurrenceRule: "FREQ=WEEKLY",
        });
      }
    }

    console.log("Criação de tarefas concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a criação das tarefas:", error);
    throw error;
  }
}
// Execute the script
seedHouseholdTasks()
  .then(() => {
    console.log("Script de seed finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao executar script de seed:", error);
    process.exit(1);
  });
