import { storage } from "../server/storage";
import { addDays } from "date-fns";
import dotenv from "dotenv";
dotenv.config();
// Função principal para semear as tarefas
async function seedHouseholdTasks() {
  try {
    // Obter IDs de usuários existentes para atribuir as tarefas
    // Você precisará ter pelo menos dois usuários no banco de dados

    const user1 = await storage.getUserByEmail("jucustodio15@gmail.com");
    const user2 = await storage.getUserByEmail("matheus.murbach@gmail.com");

    const userId1 = user1?.id;
    const userId2 = user2?.id;

    if (!userId1 || !userId2) {
      throw new Error("Usuários não encontrados");
    }

    // Tarefas diárias
    const tarefasDiarias = [
      "Arrumar a cama",
      "Passar aspirador de pó",
      "Passar pano",
      "Limpar a cozinha",
      "Lavar as louças",
      "Limpar a mesa",
      "Limpar as cadeiras e o sofá",
      "Organizar e arrumar as roupas",
      "Tirar os lixos",
      "Limpar o robô aspirador",
    ];

    // Tarefas semanais
    const tarefasSemanais = [
      "Lavar banheiros",
      "Tirar pó dos móveis",
      "Limpar janelas",
      "Limpar espelho",
      "Limpar as portas do guarda roupa",
      "Limpar as portas no total",
      "Lavar as roupas",
      "Fazer marmitas semanais",
    ];

    console.log("Iniciando criação de tarefas diárias...");

    // Criar tarefas diárias
    for (const tarefa of tarefasDiarias) {
      // Alternar entre os dois usuários para criação e atribuição
      const createdBy = Math.random() > 0.5 ? userId1 : userId2;
      const assignedTo = createdBy === userId1 ? userId2 : userId1;

      const task = await storage.createHouseholdTask({
        title: tarefa,
        description: `Tarefa diária: ${tarefa}`,
        frequency: "daily",
        createdBy,
        assignedTo,
        dueDate: null, // Sem data de vencimento específica para tarefas diárias
        completed: false,
        recurrenceRule: "FREQ=DAILY",
      });

      console.log(`Tarefa diária criada: ${tarefa} (ID: ${task.id})`);
    }

    console.log("Iniciando criação de tarefas semanais...");

    // Criar tarefas semanais
    for (const tarefa of tarefasSemanais) {
      // Alternar entre os dois usuários para criação e atribuição
      const createdBy = Math.random() > 0.5 ? userId1 : userId2;
      const assignedTo = createdBy === userId1 ? userId2 : userId1;

      // Definir data de vencimento para o próximo domingo
      const today = new Date();
      const daysUntilSunday = 7 - today.getDay();
      const dueDate = addDays(today, daysUntilSunday);

      // Definir data de término da recorrência para 3 meses a partir de hoje
      const recurrenceEnd = addDays(today, 90);

      const task = await storage.createHouseholdTask({
        title: tarefa,
        description: `Tarefa semanal: ${tarefa}`,
        frequency: "weekly",
        createdBy,
        assignedTo,
        dueDate,
        completed: false,
        recurrenceRule: "FREQ=WEEKLY",
      });

      console.log(`Tarefa semanal criada: ${tarefa} (ID: ${task.id})`);
    }

    console.log("Criação de tarefas concluída com sucesso!");
  } catch (error) {
    console.error("Erro durante a criação das tarefas:", error);
    throw error;
  }
} // Executar o script
seedHouseholdTasks()
  .then(() => {
    console.log("Script de seed finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro ao executar script de seed:", error);
    process.exit(1);
  });
