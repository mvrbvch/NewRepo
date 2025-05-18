import { storage } from "../server/storage";

async function seedAllHouseholdTasks() {
  // Substitua pelos IDs reais dos usuários
  const userId1 = 1;
  const userId2 = 2;

  const tasks = [
    // Cômodo 1 - Quarto de casal
    {
      title: "Limpar e organizar cômoda",
      description: "Cômodo 1 - Quarto de casal",
    },
    {
      title: "Tirar pó e organizar mesa do trabalho",
      description: "Cômodo 1 - Quarto de casal",
    },
    {
      title: "Limpar as portas do guarda roupas",
      description: "Cômodo 1 - Quarto de casal",
    },
    {
      title: "Tirar todo o lixo, inclusive embaixo da cama e banheiro",
      description: "Cômodo 1 - Quarto de casal",
    },
    { title: "Passar pano", description: "Cômodo 1 - Quarto de casal" },
    {
      title: "Passar aspirador de pó",
      description: "Cômodo 1 - Quarto de casal",
    },
    { title: "Limpar o espelho", description: "Cômodo 1 - Quarto de casal" },
    {
      title: "Limpar e organizar pia do banheiro",
      description: "Cômodo 1 - Quarto de casal",
    },
    {
      title: "Colocar e revistar as roupas para lavar",
      description: "Cômodo 1 - Quarto de casal",
    },

    // Cômodo 2 - Escritório
    {
      title: "Guardar o resto das roupas no guarda roupas",
      description: "Cômodo 2 - Escritório",
    },
    {
      title: "Organizar e limpar mesa do Matheus",
      description: "Cômodo 2 - Escritório",
    },
    {
      title: "Limpar portas do guarda roupas",
      description: "Cômodo 2 - Escritório",
    },
    { title: "Passar pano", description: "Cômodo 2 - Escritório" },
    { title: "Passar aspirador de pó", description: "Cômodo 2 - Escritório" },

    // Cômodo 3 - Sala
    { title: "Passar pano", description: "Cômodo 3 - Sala" },
    { title: "Passar aspirador de pó", description: "Cômodo 3 - Sala" },
    { title: "Limpar sofá", description: "Cômodo 3 - Sala" },
    { title: "Tirar pó da estante", description: "Cômodo 3 - Sala" },

    // Cômodo 5 - Copa
    { title: "Limpar estante de suprimentos", description: "Cômodo 5 - Copa" },
    { title: "Passar pano", description: "Cômodo 5 - Copa" },
    { title: "Passar aspirador de pó", description: "Cômodo 5 - Copa" },
    { title: "Guardar as louças", description: "Cômodo 5 - Copa" },
    { title: "Limpar as cadeiras", description: "Cômodo 5 - Copa" },
    { title: "Limpar mesa", description: "Cômodo 5 - Copa" },

    // Cômodo 6 - Cozinha
    {
      title: "Tirar comidas antigas da geladeira para jogar fora",
      description: "Cômodo 6 - Cozinha",
    },
    {
      title: "Limpar a geladeira e microondas",
      description: "Cômodo 6 - Cozinha",
    },
    {
      title: "Limpar os móveis e organizar a cozinha",
      description: "Cômodo 6 - Cozinha",
    },
    { title: "Lavar o chão", description: "Cômodo 6 - Cozinha" },
    { title: "Lavar a louça", description: "Cômodo 6 - Cozinha" },

    // Cômodo 7 - Banheiros
    { title: "Enxaguar", description: "Cômodo 7 - Banheiros" },
    { title: "Secar", description: "Cômodo 7 - Banheiros" },
    { title: "Esfregar chão", description: "Cômodo 7 - Banheiros" },
    { title: "Esfregar paredes", description: "Cômodo 7 - Banheiros" },
    { title: "Esfregar privada", description: "Cômodo 7 - Banheiros" },
    { title: "Colocar pato na privada", description: "Cômodo 7 - Banheiros" },

    // Faltou
    { title: "Lavar banheiros", description: "Tarefas gerais" },
    { title: "Limpar prateleira", description: "Tarefas gerais" },
    { title: "Guardar todas as roupas", description: "Tarefas gerais" },
    { title: "Limpar mesas de trabalho", description: "Tarefas gerais" },
    { title: "Limpar as portas", description: "Tarefas gerais" },
    { title: "Limpar janelas", description: "Tarefas gerais" },
    {
      title: "Arrumar as caixas do guarda roupa branco",
      description: "Tarefas gerais",
    },
    { title: "Limpar e arrumar ventiladores", description: "Tarefas gerais" },
    { title: "Limpar tanque de roupas", description: "Cômodo 6 - Cozinha" },
    { title: "Limpar armário cozinha", description: "Cômodo 6 - Cozinha" },
  ];

  for (const task of tasks) {
    await storage.createHouseholdTask({
      title: task.title,
      description: task.description,
      category: "cleaning",
      frequency: "daily",
      recurrenceRule: "daily",
      priority: 1, // ajuste se quiser variar
      createdBy: 1,
      assignedTo: null,
      completed: false,
    });
  }

  console.log("Todas as tarefas foram criadas para ambos os usuários!");
}

seedAllHouseholdTasks().catch(console.error);
