// Utilitários para formatação segura de datas e outros tipos

/**
 * Formata uma data de forma segura, tratando diferentes formatos
 * e retornando null quando não consegue formatar
 */
export function formatDateSafely(date: any): string | null {
  if (!date) return null;
  
  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.log('Data inválida (Date object):', date);
        return null;
      }
      return date.toISOString();
    } 
    else if (typeof date === 'string') {
      // Para datas no formato YYYY-MM-DD, adicione a parte de tempo
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = `${date}T00:00:00.000Z`;
      }
      
      // Verificar se a string de data pode ser convertida em um Date válido
      const tempDate = new Date(date);
      if (isNaN(tempDate.getTime())) {
        console.log('Data inválida (string):', date);
        return null;
      }
      return tempDate.toISOString();
    }
  } catch (err) {
    console.error('Erro ao processar data:', err, date);
  }
  
  return null;
}