import { pool } from "../db";

// Define task categories
const DAILY = "daily";
const WEEKLY = "weekly";

// Mock function to get a random user ID
function getRandomUserId(): number {
  return Math.floor(Math.random() * 1000); // Replace with actual logic
}

// Define the tasks
const householdTasks = [
  {
    title: "Limpar e organizar cômoda",
    description: "Cômodo 1 - Quarto de casal",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1, // Média prioridade
    assignedTo: getRandomUserId(),
  },
  {
    title: "Tirar pó e organizar mesa do trabalho",
    description: "Cômodo 1 - Quarto de casal",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2, // Alta prioridade
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar as portas do guarda roupas",
    description: "Cômodo 1 - Quarto de casal",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0, // Baixa prioridade
    assignedTo: getRandomUserId(),
  },
  {
    title: "Guardar o resto das roupas no guarda roupas",
    description: "Cômodo 2 - Escritório",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Organizar e limpar mesa do Matheus",
    description: "Cômodo 2 - Escritório",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar portas do guarda roupas",
    description: "Cômodo 2 - Escritório",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar estante de suprimentos",
    description: "Cômodo 5 - Copa",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Tirar comidas antigas da geladeira para jogar fora",
    description: "Cômodo 6 - Cozinha",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar a geladeira e microondas",
    description: "Cômodo 6 - Cozinha",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar os móveis e organizar a cozinha",
    description: "Cômodo 6 - Cozinha",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Lavar banheiros",
    description: "Cômodo 7 - Banheiros",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar prateleira",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Guardar todas as roupas",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar mesas de trabalho",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar as portas",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar janelas",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Arrumar as caixas do guarda roupa branco",
    description: "Tarefas gerais",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar e arrumar ventiladores",
    description: "Tarefas gerais",
    category: "maintenance",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 2,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar tanque de roupas",
    description: "Cômodo 6 - Cozinha",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 0,
    assignedTo: getRandomUserId(),
  },
  {
    title: "Limpar armário cozinha",
    description: "Cômodo 6 - Cozinha",
    category: "cleaning",
    frequency: "daily",
    recurrenceRule: "daily",
    priority: 1,
    assignedTo: getRandomUserId(),
  },
];

/**
 * Função para adicionar as tarefas ao banco de dados
 */
async function addHouseholdTasks() {
  const client = await pool.connect();

  try {
    // Iniciar uma transação
    await client.query("BEGIN");

    console.log("Adicionando tarefas domésticas ao banco de dados...");

    // Verificar se já existe uma tabela de tarefas
    const tableCheckQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'household_tasks'
      );
    `;

    await client.query(tableCheckQuery); // Check if the table exists

    // Inserir as tarefas
    for (const task of householdTasks) {
      await client.query(
        `INSERT INTO tasks (name, description, category) 
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE 
         SET description = $2, category = $3, updated_at = CURRENT_TIMESTAMP`,
        [task.title, task.description, task.category]
      );
    }

    // Confirmar a transação
    await client.query("COMMIT");

    console.log(
      `Adicionadas ${householdTasks.length} tarefas domésticas com sucesso!`
    );
    console.log(
      `- ${householdTasks.filter((t) => t.category === DAILY).length} tarefas diárias`
    );
    console.log(
      `- ${householdTasks.filter((t) => t.category === WEEKLY).length} tarefas semanais`
    );
  } catch (error) {
    // Reverter em caso de erro
    await client.query("ROLLBACK");
    console.error("Erro ao adicionar tarefas:", error);
    throw error;
  } finally {
    // Liberar o cliente
    client.release();
  }
}

// Executar a função principal
addHouseholdTasks()
  .then(() => {
    console.log("Script concluído com sucesso.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Falha na execução do script:", error);
    process.exit(1);
  });
