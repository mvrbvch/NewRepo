import { pool } from "../db";

// Define task categories
const DAILY = "daily";
const WEEKLY = "weekly";

// Define the tasks
const householdTasks = [
  // Daily tasks
  {
    name: "Arrumar a cama",
    description: "Organizar lençóis e cobertores",
    category: DAILY,
  },
  {
    name: "Passar aspirador de pó",
    description: "Limpar o chão de todos os cômodos",
    category: DAILY,
  },
  {
    name: "Passar pano",
    description: "Passar pano úmido no chão após aspirar",
    category: DAILY,
  },
  {
    name: "Limpar a cozinha",
    description: "Limpar bancadas e eletrodomésticos",
    category: DAILY,
  },
  {
    name: "Lavar as louças",
    description: "Lavar e guardar todas as louças usadas",
    category: DAILY,
  },
  {
    name: "Limpar a mesa",
    description: "Limpar a mesa de jantar após as refeições",
    category: DAILY,
  },
  {
    name: "Limpar as cadeiras e o sofá",
    description: "Remover poeira e migalhas",
    category: DAILY,
  },
  {
    name: "Organizar e arrumar as roupas",
    description: "Dobrar e guardar roupas limpas",
    category: DAILY,
  },
  {
    name: "Tirar os lixos",
    description: "Esvaziar todas as lixeiras da casa",
    category: DAILY,
  },
  {
    name: "Limpar o robô aspirador",
    description: "Esvaziar e limpar o compartimento",
    category: DAILY,
  },

  // Weekly tasks
  {
    name: "Lavar banheiros",
    description: "Limpar pias, vasos sanitários e box",
    category: WEEKLY,
  },
  {
    name: "Tirar pó dos móveis",
    description: "Limpar todas as superfícies de móveis",
    category: WEEKLY,
  },
  {
    name: "Limpar janelas",
    description: "Limpar vidros e batentes",
    category: WEEKLY,
  },
  {
    name: "Limpar espelho",
    description: "Limpar todos os espelhos da casa",
    category: WEEKLY,
  },
  {
    name: "Limpar as portas do guarda roupa",
    description: "Limpar portas e puxadores",
    category: WEEKLY,
  },
  {
    name: "Limpar as portas no total",
    description: "Limpar todas as portas da casa",
    category: WEEKLY,
  },
  {
    name: "Lavar as roupas",
    description: "Lavar, secar e passar as roupas da semana",
    category: WEEKLY,
  },
  {
    name: "Fazer marmitas semanais",
    description: "Preparar refeições para a semana",
    category: WEEKLY,
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
        AND table_name = 'tasks'
      );
    `;

    const tableExists = (await client.query(tableCheckQuery)).rows[0].exists;

    if (!tableExists) {
      console.log("Tabela de tarefas não encontrada. Criando tabela...");

      // Criar tabela de tarefas se não existir
      await client.query(`
        CREATE TABLE tasks (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("Tabela de tarefas criada com sucesso.");
    }

    // Inserir as tarefas
    for (const task of householdTasks) {
      await client.query(
        `INSERT INTO tasks (name, description, category) 
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE 
         SET description = $2, category = $3, updated_at = CURRENT_TIMESTAMP`,
        [task.name, task.description, task.category]
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
