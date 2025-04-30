import OpenAI from "openai";
import { IStorage } from "./storage";
import { PerplexityService } from "./perplexityService";

// O modelo mais recente da OpenAI é "gpt-4o" que foi lançado em 13 de maio de 2024. Não altere isso a menos que explicitamente solicitado pelo usuário
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const perplexityService = new PerplexityService();

export enum TipCategory {
  COMMUNICATION = "communication",
  QUALITY_TIME = "quality_time",
  CONFLICT_RESOLUTION = "conflict_resolution", 
  RELATIONSHIP_GROWTH = "relationship_growth",
  SHARED_GOALS = "shared_goals",
  DAILY_HABITS = "daily_habits"
}

export interface RelationshipTip {
  id: number;
  userId: number;
  partnerId: number;
  category: TipCategory;
  title: string;
  content: string;
  actionItems: string[];
  createdAt: Date;
  saved: boolean;
  customData?: any;
}

export interface GenerateTipParams {
  userId: number;
  partnerId: number;
  category?: TipCategory;
  customPrompt?: string;
  contextData?: any;
}

/**
 * Serviço para gerar dicas e sugestões para relacionamentos
 * usando IA (OpenAI ou Perplexity)
 */
export class RelationshipTipsService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  /**
   * Gera uma dica de relacionamento personalizada
   */
  public async generateTip(params: GenerateTipParams): Promise<RelationshipTip | null> {
    try {
      const { userId, partnerId, category, customPrompt, contextData } = params;
      
      // Obter dados dos usuários
      const user = await this.storage.getUser(userId);
      const partner = await this.storage.getUser(partnerId);
      
      if (!user || !partner) {
        console.error("Usuário ou parceiro não encontrado");
        return null;
      }

      // Obter dados para contextualizar a dica
      const recentTasks = await this.storage.getRecentHouseholdTasks(userId, partnerId, 30); // últimos 30 dias
      const recentEvents = await this.storage.getRecentEvents(userId, partnerId, 30); // últimos 30 dias
      
      // Selecionar categoria aleatória se não for especificada
      const selectedCategory = category || this.getRandomCategory();
      
      // Primeiramente tentar gerar com Perplexity API
      if (perplexityService.isConfigured()) {
        try {
          const perplexityTip = await this.generateTipWithPerplexity(
            user,
            partner,
            selectedCategory,
            recentTasks,
            recentEvents,
            customPrompt,
            contextData
          );
          
          if (perplexityTip) {
            // Salvar a dica no banco de dados
            const savedTip = await this.saveTip({
              ...perplexityTip,
              userId,
              partnerId,
              createdAt: new Date(),
              saved: false
            });
            
            return savedTip;
          }
        } catch (error) {
          console.warn("Erro ao gerar dica com Perplexity API:", error);
        }
      }
      
      // Se Perplexity falhar, tentar OpenAI
      try {
        console.log("Tentando gerar dica com OpenAI...");
        const openAITip = await this.generateTipWithOpenAI(
          user,
          partner,
          selectedCategory,
          recentTasks,
          recentEvents,
          customPrompt,
          contextData
        );
        
        if (openAITip) {
          // Salvar a dica no banco de dados
          const savedTip = await this.saveTip({
            ...openAITip,
            userId,
            partnerId,
            createdAt: new Date(),
            saved: false
          });
          
          return savedTip;
        }
      } catch (error) {
        console.warn("Erro ao gerar dica com OpenAI:", error);
      }
      
      // Se ambas as APIs falharem, gerar localmente
      console.log("Gerando dica localmente...");
      const localTip = this.generateLocalTip(user, partner, selectedCategory);
      
      // Salvar a dica local no banco de dados
      const savedTip = await this.saveTip({
        ...localTip,
        userId,
        partnerId,
        createdAt: new Date(),
        saved: false
      });
      
      return savedTip;
    } catch (error) {
      console.error("Erro ao gerar dica de relacionamento:", error);
      return null;
    }
  }

  /**
   * Marca uma dica como salva/favorita
   */
  public async saveTipToFavorites(tipId: number): Promise<boolean> {
    try {
      const tip = await this.storage.getRelationshipTip(tipId);
      
      if (!tip) {
        return false;
      }
      
      const updated = await this.storage.updateRelationshipTip(tipId, {
        ...tip,
        saved: true
      });
      
      return !!updated;
    } catch (error) {
      console.error("Erro ao salvar dica como favorita:", error);
      return false;
    }
  }

  /**
   * Remove uma dica dos favoritos
   */
  public async removeFromFavorites(tipId: number): Promise<boolean> {
    try {
      const tip = await this.storage.getRelationshipTip(tipId);
      
      if (!tip) {
        return false;
      }
      
      const updated = await this.storage.updateRelationshipTip(tipId, {
        ...tip,
        saved: false
      });
      
      return !!updated;
    } catch (error) {
      console.error("Erro ao remover dica dos favoritos:", error);
      return false;
    }
  }

  /**
   * Gera uma dica usando a API Perplexity
   */
  private async generateTipWithPerplexity(
    user: any,
    partner: any,
    category: TipCategory,
    recentTasks: any[],
    recentEvents: any[],
    customPrompt?: string,
    contextData?: any
  ): Promise<Omit<RelationshipTip, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'saved'> | null> {
    const systemMessage = "Você é um assistente especializado em relacionamentos, oferecendo dicas construtivas e práticas para casais.";
    
    // Preparar dados para o prompt
    const tasksData = this.formatTasksForPrompt(recentTasks);
    const eventsData = this.formatEventsForPrompt(recentEvents);
    
    const categoryInfo = this.getCategoryPrompt(category);
    
    const userMessage = customPrompt || `
Você é um especialista em relacionamentos que oferece conselhos construtivos e práticos para casais.

Casal:
- ${user.name} e ${partner.name}

Dados recentes de tarefas:
${tasksData}

Eventos recentes:
${eventsData}

${contextData ? `Contexto adicional:\n${JSON.stringify(contextData)}\n` : ''}

Crie uma dica personalizada na categoria "${categoryInfo.title}" para este casal.
A dica deve ser:
1. Específica para eles, considerando suas atividades recentes
2. Positiva e construtiva, focando em fortalecer o relacionamento
3. Prática e acionável, com sugestões claras
4. Respeitosa e não julgadora

Retorne sua dica em formato JSON com os seguintes campos:
- title: um título curto e atrativo para a dica (máximo 50 caracteres)
- content: o texto principal da dica (cerca de 200 palavras)
- category: "${category}" (não altere a categoria)
- actionItems: um array com 2-3 ações práticas que o casal pode implementar

Não inclua explicações, apenas o objeto JSON.
`;

    try {
      const response = await fetch(perplexityService.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${perplexityService.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: perplexityService.defaultModel,
          messages: [
            {
              role: "system",
              content: systemMessage
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.5,
          presence_penalty: 0.2,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro na API Perplexity: ${response.status} ${errorData}`);
      }

      const responseData = await response.json();
      console.log("Resposta da API Perplexity:", JSON.stringify(responseData, null, 2));

      const contentText = responseData.choices[0]?.message?.content;
      if (!contentText) {
        throw new Error("Resposta vazia da API Perplexity");
      }

      // Limpar a resposta - remover blocos de código markdown se presentes
      let cleanedText = contentText;
      if (cleanedText.includes('```')) {
        const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match && match[1]) {
          cleanedText = match[1].trim();
        }
      }

      // Analisar o resultado da API
      const result = JSON.parse(cleanedText);
      
      return {
        title: result.title,
        content: result.content,
        category: category,
        actionItems: result.actionItems
      };
    } catch (error) {
      console.error("Erro ao gerar dica com Perplexity:", error);
      return null;
    }
  }

  /**
   * Gera uma dica usando a API OpenAI
   */
  private async generateTipWithOpenAI(
    user: any,
    partner: any,
    category: TipCategory,
    recentTasks: any[],
    recentEvents: any[],
    customPrompt?: string,
    contextData?: any
  ): Promise<Omit<RelationshipTip, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'saved'> | null> {
    try {
      // Preparar dados para o prompt
      const tasksData = this.formatTasksForPrompt(recentTasks);
      const eventsData = this.formatEventsForPrompt(recentEvents);
      
      const categoryInfo = this.getCategoryPrompt(category);
      
      const prompt = customPrompt || `
Você é um especialista em relacionamentos que oferece conselhos construtivos e práticos para casais.

Casal:
- ${user.name} e ${partner.name}

Dados recentes de tarefas:
${tasksData}

Eventos recentes:
${eventsData}

${contextData ? `Contexto adicional:\n${JSON.stringify(contextData)}\n` : ''}

Crie uma dica personalizada na categoria "${categoryInfo.title}" para este casal.
A dica deve ser:
1. Específica para eles, considerando suas atividades recentes
2. Positiva e construtiva, focando em fortalecer o relacionamento
3. Prática e acionável, com sugestões claras
4. Respeitosa e não julgadora

Retorne sua dica em formato JSON com os seguintes campos:
- title: um título curto e atrativo para a dica (máximo 50 caracteres)
- content: o texto principal da dica (cerca de 200 palavras)
- category: "${category}" (não altere a categoria)
- actionItems: um array com 2-3 ações práticas que o casal pode implementar
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Você é um assistente especializado em relacionamentos, oferecendo dicas construtivas e práticas para casais."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });
      
      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        throw new Error("Resposta vazia da API OpenAI");
      }
      
      // Analisar o resultado da API
      const result = JSON.parse(responseContent);
      
      return {
        title: result.title,
        content: result.content,
        category: category,
        actionItems: result.actionItems
      };
    } catch (error) {
      console.error("Erro ao gerar dica com OpenAI:", error);
      return null;
    }
  }

  /**
   * Gera uma dica localmente (sem APIs externas)
   */
  private generateLocalTip(
    user: any,
    partner: any,
    category: TipCategory
  ): Omit<RelationshipTip, 'id' | 'userId' | 'partnerId' | 'createdAt' | 'saved'> {
    const categoryInfo = this.getCategoryPrompt(category);
    const tips = this.getLocalTipsByCategory(category);
    
    // Selecionar uma dica aleatória da categoria
    const randomIndex = Math.floor(Math.random() * tips.length);
    const selectedTip = tips[randomIndex];
    
    return {
      title: selectedTip.title,
      content: selectedTip.content.replace('[USER]', user.name).replace('[PARTNER]', partner.name),
      category: category,
      actionItems: selectedTip.actionItems
    };
  }

  /**
   * Salva uma dica no banco de dados
   */
  private async saveTip(tip: Omit<RelationshipTip, 'id'>): Promise<RelationshipTip | null> {
    try {
      const savedTip = await this.storage.createRelationshipTip(tip);
      return savedTip;
    } catch (error) {
      console.error("Erro ao salvar dica:", error);
      return null;
    }
  }

  /**
   * Formata tarefas para incluir no prompt
   */
  private formatTasksForPrompt(tasks: any[]): string {
    if (!tasks || tasks.length === 0) {
      return "Sem dados recentes de tarefas.";
    }
    
    return tasks.slice(0, 5).map(task => {
      const status = task.completedAt ? "Concluída" : task.dueDate && new Date(task.dueDate) < new Date() ? "Atrasada" : "Pendente";
      return `- ${task.title} (${status}, Atribuída a: ${task.assignedToId ? task.assignedToName : "Ninguém"})`;
    }).join("\n");
  }

  /**
   * Formata eventos para incluir no prompt
   */
  private formatEventsForPrompt(events: any[]): string {
    if (!events || events.length === 0) {
      return "Sem dados recentes de eventos.";
    }
    
    return events.slice(0, 5).map(event => {
      return `- ${event.title} (${new Date(event.startDate).toLocaleDateString()})`;
    }).join("\n");
  }

  /**
   * Seleciona uma categoria aleatória
   */
  private getRandomCategory(): TipCategory {
    const categories = Object.values(TipCategory);
    const randomIndex = Math.floor(Math.random() * categories.length);
    return categories[randomIndex];
  }

  /**
   * Obtém informações de prompt para uma categoria
   */
  private getCategoryPrompt(category: TipCategory): { title: string, description: string } {
    switch (category) {
      case TipCategory.COMMUNICATION:
        return {
          title: "Comunicação",
          description: "Dicas para melhorar a comunicação entre o casal"
        };
      case TipCategory.QUALITY_TIME:
        return {
          title: "Tempo de Qualidade",
          description: "Sugestões para aproveitar melhor o tempo juntos"
        };
      case TipCategory.CONFLICT_RESOLUTION:
        return {
          title: "Resolução de Conflitos",
          description: "Estratégias para resolver desacordos de forma saudável"
        };
      case TipCategory.RELATIONSHIP_GROWTH:
        return {
          title: "Crescimento do Relacionamento",
          description: "Ideias para fortalecer e desenvolver o relacionamento"
        };
      case TipCategory.SHARED_GOALS:
        return {
          title: "Objetivos Compartilhados",
          description: "Sugestões para estabelecer e alcançar metas como casal"
        };
      case TipCategory.DAILY_HABITS:
        return {
          title: "Hábitos Diários",
          description: "Pequenas práticas diárias para fortalecer o relacionamento"
        };
      default:
        return {
          title: "Dica de Relacionamento",
          description: "Sugestão para melhorar seu relacionamento"
        };
    }
  }

  /**
   * Retorna dicas pré-definidas por categoria para uso local
   */
  private getLocalTipsByCategory(category: TipCategory): Array<{
    title: string;
    content: string;
    actionItems: string[];
  }> {
    switch (category) {
      case TipCategory.COMMUNICATION:
        return [
          {
            title: "Pratique a escuta ativa",
            content: "A comunicação eficaz é fundamental para um relacionamento saudável. [USER] e [PARTNER], quando vocês praticam a escuta ativa - prestando total atenção, sem interrupções e demonstrando que realmente ouviram o que o outro disse - vocês criam um ambiente de respeito mútuo. Tente reservar um tempo regular sem distrações (telefones, TV) para conversas significativas, onde cada um possa expressar suas necessidades e sentimentos sem julgamentos.",
            actionItems: [
              "Reserve 15 minutos diários para conversas sem distrações digitais",
              "Use a técnica de reformulação: 'O que entendi foi...'",
              "Faça perguntas abertas para entender melhor o ponto de vista do outro"
            ]
          },
          {
            title: "O poder das palavras positivas",
            content: "Estudos mostram que relacionamentos saudáveis têm uma proporção de pelo menos 5 interações positivas para cada negativa. [USER] e [PARTNER], praticar o uso consciente de palavras positivas, expressões de gratidão e apreciação pode transformar a atmosfera do relacionamento. Mesmo em momentos de desacordo, a forma como as preocupações são expressas faz toda a diferença.",
            actionItems: [
              "Compartilhe pelo menos um elogio sincero diariamente",
              "Expresse gratidão por pequenas ações do dia-a-dia",
              "Use 'eu me sinto' em vez de acusações quando houver frustração"
            ]
          }
        ];
      case TipCategory.QUALITY_TIME:
        return [
          {
            title: "Redescubram atividades favoritas",
            content: "Com a correria do dia a dia, é comum casais perderem de vista as atividades que costumavam desfrutar juntos. [USER] e [PARTNER], redescobrir e reservar tempo para hobbies ou interesses compartilhados pode revitalizar a conexão entre vocês. Não é necessário planejar eventos elaborados - pequenos momentos de alegria compartilhada fortalecem os laços.",
            actionItems: [
              "Criem uma lista de atividades que ambos gostam",
              "Reservem um tempo semanal dedicado a uma dessas atividades",
              "Tentem algo novo juntos pelo menos uma vez por mês"
            ]
          },
          {
            title: "Rituais diários de conexão",
            content: "Os pequenos momentos de conexão diária são tão importantes quanto os grandes eventos. [USER] e [PARTNER], estabelecer rituais simples como um café da manhã juntos, uma caminhada após o jantar ou alguns minutos de conversa antes de dormir podem criar âncoras de estabilidade e intimidade no relacionamento.",
            actionItems: [
              "Identifiquem e protejam pelo menos um ritual diário de conexão",
              "Comuniquem-se brevemente durante o dia, mesmo quando separados",
              "Criem um ritual especial para os finais de semana"
            ]
          }
        ];
      case TipCategory.CONFLICT_RESOLUTION:
        return [
          {
            title: "Abordagem construtiva de conflitos",
            content: "Os conflitos são inevitáveis em qualquer relacionamento, mas a forma como são abordados determina seu impacto. [USER] e [PARTNER], aprender a ver os desacordos como oportunidades de crescimento mútuo e não como ameaças pode transformar a dinâmica do relacionamento. Praticar técnicas de comunicação não-violenta e buscar compreender a perspectiva do outro são habilidades valiosas.",
            actionItems: [
              "Estabeleçam regras básicas para discussões (sem gritos, sem interrupções)",
              "Usem a técnica de time-out quando as emoções estiverem intensas",
              "Busquem soluções onde ambos ganham, em vez de compromissos onde ambos perdem"
            ]
          },
          {
            title: "Reparo emocional após conflitos",
            content: "Mesmo nos relacionamentos mais saudáveis, ocorrem momentos de tensão. [USER] e [PARTNER], a capacidade de reparar a conexão emocional após um conflito é um preditor importante da longevidade e satisfação no relacionamento. Isso inclui reconhecer o impacto de suas ações, oferecer desculpas sinceras e fazer gestos de reconexão.",
            actionItems: [
              "Desenvolvam um sinal ou palavra para indicar desejo de reconciliação",
              "Pratiquem desculpas completas ('Eu sinto muito por... No futuro vou...')",
              "Criem um ritual pós-conflito que funcione para vocês"
            ]
          }
        ];
      case TipCategory.RELATIONSHIP_GROWTH:
        return [
          {
            title: "Cultive admiração e respeito mútuos",
            content: "Relacionamentos duradouros são construídos sobre uma fundação de admiração e respeito. [USER] e [PARTNER], nutrir conscientemente uma cultura de apreciação das qualidades, esforços e conquistas um do outro fortalece o vínculo entre vocês. Expressar regularmente o que admiram um no outro e mostrar respeito, especialmente durante desacordos, constrói resiliência no relacionamento.",
            actionItems: [
              "Compartilhem regularmente o que admiram um no outro",
              "Defendam-se mutuamente na presença de outras pessoas",
              "Mantenham um 'banco de memórias positivas' - registrando momentos especiais"
            ]
          },
          {
            title: "Cresçam juntos e separadamente",
            content: "Um relacionamento saudável envolve crescimento tanto conjunto quanto individual. [USER] e [PARTNER], apoiar os objetivos e aspirações pessoais um do outro, enquanto também estabelecem objetivos como casal, cria um equilíbrio entre autonomia e conexão. Este equilíbrio permite que ambos floresçam individualmente enquanto o relacionamento continua a evoluir.",
            actionItems: [
              "Discutam regularmente seus objetivos individuais e como apoiá-los",
              "Estabeleçam metas como casal para os próximos 3, 6 e 12 meses",
              "Celebrem tanto as conquistas individuais quanto as conjuntas"
            ]
          }
        ];
      case TipCategory.SHARED_GOALS:
        return [
          {
            title: "Visão compartilhada do futuro",
            content: "Casais que prosperam geralmente têm uma visão compartilhada do futuro. [USER] e [PARTNER], dedicar tempo para discutir seus sonhos, valores e objetivos de longo prazo ajuda a criar um senso de propósito compartilhado. Isso não significa que vocês precisam querer exatamente as mesmas coisas, mas sim encontrar um futuro que honre as aspirações de ambos.",
            actionItems: [
              "Realizem um 'retiro de visão' semestral para alinhar objetivos",
              "Criem um mural ou documento com suas metas compartilhadas",
              "Revisem regularmente o progresso e ajustem conforme necessário"
            ]
          },
          {
            title: "Projetos que unem o casal",
            content: "Trabalhar juntos em projetos compartilhados fortalece o senso de parceria. [USER] e [PARTNER], encontrar iniciativas que ambos valorizam - seja reformar a casa, planejar uma viagem especial ou iniciar um hobby conjunto - cria experiências de colaboração e realização mútua que enriquecem o relacionamento.",
            actionItems: [
              "Identifiquem um projeto que ambos considerem significativo",
              "Definam papéis claros que aproveitem as forças de cada um",
              "Celebrem pequenos marcos ao longo do caminho"
            ]
          }
        ];
      case TipCategory.DAILY_HABITS:
        return [
          {
            title: "Micromonentos de conexão",
            content: "Os pequenos momentos do dia a dia são os blocos de construção de um relacionamento sólido. [USER] e [PARTNER], criar o hábito de pequenos gestos de amor e atenção - como um abraço ao se encontrarem após o trabalho, mensagens carinhosas durante o dia ou simplesmente fazer contato visual ao conversar - mantém a conexão emocional mesmo nos períodos mais ocupados.",
            actionItems: [
              "Criem o hábito de seis segundos de beijo ao se despedirem e reencontrarem",
              "Implementem pequenos toques físicos durante interações rotineiras",
              "Façam pelo menos um pequeno gesto de carinho diariamente"
            ]
          },
          {
            title: "Rotina de gratidão compartilhada",
            content: "A prática regular de gratidão tem benefícios comprovados para o bem-estar individual e para os relacionamentos. [USER] e [PARTNER], estabelecer um ritual de compartilhar motivos de gratidão um pelo outro e pela vida que construíram juntos reforça os aspectos positivos do relacionamento e cria uma mentalidade de abundância.",
            actionItems: [
              "Compartilhem três coisas pelas quais são gratos antes de dormir",
              "Mantenham um diário conjunto de gratidão",
              "Criem o hábito de mencionar algo específico que apreciaram no outro durante o dia"
            ]
          }
        ];
      default:
        return [
          {
            title: "Construa uma caixa de ferramentas emocional",
            content: "Cada relacionamento enfrenta desafios únicos, e ter uma variedade de estratégias disponíveis é fundamental. [USER] e [PARTNER], construir uma 'caixa de ferramentas emocional' com técnicas que funcionam para vocês - como pausas conscientes durante discussões acaloradas, rituais de reconexão após desacordos, ou palavras-código para indicar necessidades - aumenta a resiliência do relacionamento.",
            actionItems: [
              "Identifiquem as estratégias que melhor funcionam para vocês em momentos difíceis",
              "Conversem sobre o que cada um precisa quando se sente estressado ou chateado",
              "Criem um 'contrato de relacionamento' com acordos sobre como lidar com situações desafiadoras"
            ]
          }
        ];
    }
  }
}