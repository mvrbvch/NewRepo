import {
  InsightGenerationResult,
  InsightType,
  TaskDistributionData,
} from "./relationshipInsightsService";
import { GenderIdentificationService } from "./utils/genderIdentificationService";

/**
 * Serviço para interagir com a API da Perplexity AI
 * Uma alternativa gratuita à OpenAI (com limites)
 */
export class PerplexityService {
  private _apiKey: string | undefined;
  private _baseUrl = "https://api.perplexity.ai/chat/completions";
  private _defaultModel = "llama-3.1-sonar-small-128k-online";

  constructor() {
    this._apiKey = process.env.PERPLEXITY_API_KEY;
  }

  /**
   * Retorna a chave da API Perplexity
   */
  public get apiKey(): string | undefined {
    return this._apiKey;
  }

  /**
   * Retorna a URL base da API Perplexity
   */
  public get baseUrl(): string {
    return this._baseUrl;
  }

  /**
   * Retorna o modelo padrão da API Perplexity
   */
  public get defaultModel(): string {
    return this._defaultModel;
  }

  /**
   * Verifica se a API está configurada (chave disponível)
   */
  public isConfigured(): boolean {
    return !!this.apiKey;
  }

  public getGender(name: string): string {
    const genderIdentificationService = new GenderIdentificationService();
    return genderIdentificationService.identifyGender(name);
  }

  /**
   * Gera um insight sobre distribuição de tarefas usando a API Perplexity
   */
  public async generateTaskDistributionInsight(
    data: TaskDistributionData
  ): Promise<InsightGenerationResult | null> {
    if (!this.isConfigured()) {
      console.warn(
        "API Perplexity não configurada (PERPLEXITY_API_KEY não definida)"
      );
      return null;
    }

    try {
      // Preparar os dados para o prompt
      const userCompletionPercent = Math.round(data.user.completionRate * 100);
      const partnerCompletionPercent = Math.round(
        data.partner.completionRate * 100
      );

      const categoriesData = Object.entries(data.categories)
        .map(([category, counts]) => {
          const total = counts.user + counts.partner;
          const userPercent =
            total > 0 ? Math.round((counts.user / total) * 100) : 0;
          const partnerPercent =
            total > 0 ? Math.round((counts.partner / total) * 100) : 0;
          return `${category}: ${data.user.name} ${userPercent}%, ${data.partner.name} ${partnerPercent}%`;
        })
        .join("\n");

      // Construir o prompt
      const systemMessage =
        "Você é um assistente especializado em insights de relacionamento com base em dados.";
      const userMessage = `
Você é um consultor de relacionamentos especializado em analisar dinâmicas entre casais.
Analise os seguintes dados sobre a distribuição e conclusão de tarefas domésticas entre um casal:

DADOS DO CASAL:
- ${data.user.name.split(" ")}: ${data.user.total} tarefas totais, ${data.user.completed} concluídas (${userCompletionPercent}%), ${data.user.pending} pendentes, ${data.user.overdue} atrasadas
- ${data.partner.name}: ${data.partner.total} tarefas totais, ${data.partner.completed} concluídas (${partnerCompletionPercent}%), ${data.partner.pending} pendentes, ${data.partner.overdue} atrasadas
- Gêneros ${data.user.name.split(" ")}: ${this.getGender(data.user.name)}
- Gêneros ${data.partner.name.split(" ")}: ${this.getGender(data.partner.name)}

DISTRIBUIÇÃO POR CATEGORIA:
${categoriesData}

Com base nesses dados, crie um insight útil e construtivo sobre a dinâmica de distribuição de tarefas do casal. Seu insight deve ser:
1. Personalizado e específico para este casal
2. Respeitoso e construtivo, sem culpar nenhum dos parceiros
3. Focado em identificar padrões e sugerir melhorias para o equilíbrio das tarefas
4. Destacar as vantagens de uma rotina bem organizada em casal, como:
   - Maior tempo de qualidade juntos
   - Redução do estresse e conflitos
   - Sensação de parceria e equidade
   - Melhoria da comunicação e satisfação no relacionamento

Retorne sua análise em formato JSON com os seguintes campos:
- title: um título curto e impactante para o insight (máximo 50 caracteres)
- content: o texto completo do insight (150-200 palavras)
- sentiment: "positive", "negative", ou "neutral" dependendo do tom geral
- score: um número de 1 a 10 indicando a importância/urgência deste insight (10 sendo o mais urgente)
- actions: um array com 2-3 sugestões práticas que o casal pode implementar

Não inclua explicações, apenas o objeto JSON.
`;

      // Chamada à API Perplexity
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: userMessage,
            },
          ],
          max_tokens: 1024,
          temperature: 0.2,
          top_p: 0.9,
          frequency_penalty: 1,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Erro na API Perplexity: ${response.status} ${errorData}`
        );
      }

      const responseData = await response.json();
      console.log(
        "Resposta da API Perplexity:",
        JSON.stringify(responseData, null, 2)
      );

      const contentText = responseData.choices[0]?.message?.content;
      if (!contentText) {
        throw new Error("Resposta vazia da API Perplexity");
      }

      // Limpar a resposta - remover blocos de código markdown se presentes
      let cleanedText = contentText;
      // Remover blocos de código markdown (```json ... ```)
      if (cleanedText.includes("```")) {
        // Obter texto entre os delimitadores de código
        const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match && match[1]) {
          cleanedText = match[1].trim();
          console.log("Texto limpo do markdown:", cleanedText);
        } else {
          console.warn(
            "Não foi possível extrair o conteúdo JSON dos delimitadores de código markdown"
          );
        }
      }

      console.log("Texto limpo:", cleanedText);

      // Analisar o resultado da API
      const result = JSON.parse(cleanedText);

      return {
        type: InsightType.TASK_BALANCE,
        title: result.title,
        content: result.content,
        sentiment: result.sentiment,
        score: result.score,
        actions: result.actions,
        rawData: data,
      };
    } catch (error) {
      console.error("Erro ao gerar insight com a API Perplexity:", error);
      return null;
    }
  }

  /**
   * Gera um apelido baseado no nome usando a API Perplexity
   */
  public async generateNicknameBasedOnName(name: string): Promise<string> {
    return this.generateLocalNickname(name);
  }

  private generateLocalNickname(name: string): string {
    if (!name) return "Amor";

    const firstName = name.split(" ")[0];
    const isMale = ["o", "r", "l", "s", "z"].includes(
      firstName.slice(-1).toLowerCase()
    );

    const options = [
      isMale ? `${firstName}zão` : `${firstName}zinha`,
      firstName,
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
}
