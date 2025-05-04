// Utilitários para formatação segura de datas e outros tipos

/**
 * Formata uma data de forma segura, tratando diferentes formatos
 * e retornando null quando não consegue formatar
 */
export function formatDateSafely(date: any): string | null {
  if (!date) return null;

  try {
    // Se for null ou undefined, retorna null
    if (date === null || date === undefined) {
      return null;
    }

    // Se for um objeto Date válido
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.log("Data inválida (Date object):", date);
        return null;
      }
      return date.toISOString();
    }

    // Se for uma string
    if (typeof date === "string") {
      // Data no formato ISO sem a parte de hora (YYYY-MM-DD)
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Cria uma data às 12:00 UTC para evitar problemas de fuso horário
        return new Date(`${date}T12:00:00.000Z`).toISOString();
      }

      // Tenta converter a string para um objeto Date válido
      const tempDate = new Date(date);
      if (isNaN(tempDate.getTime())) {
        console.log("Data inválida (string):", date);
        return null;
      }
      return tempDate.toISOString();
    }

    // Para outros tipos, retorna null
    console.log("Tipo de data não suportado:", typeof date, date);
    return null;
  } catch (err) {
    console.error("Erro ao processar data:", err, date);
    return null;
  }
}

/**
 * Converte uma string de data para um objeto Date
 * Retorna null se a conversão falhar
 */
export function parseDateSafely(dateStr: string | null): Date | null {
  if (!dateStr) return null;

  try {
    // Para datas no formato YYYY-MM-DD, adicione a parte de tempo
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateStr = `${dateStr}T12:00:00.000Z`;
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch (err) {
    console.error("Erro ao converter string para Date:", err, dateStr);
    return null;
  }
}
