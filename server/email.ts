import { Resend } from 'resend';

// Verificar se a chave está presente
if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY não está definida. Não será possível enviar e-mails.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { to, subject, html, text } = options;
    // No ambiente de teste do Resend, é obrigatório usar o endereço 'onboarding@resend.dev' como remetente
    // pois este é o único domínio autorizado para a conta gratuita
    const from = options.from || 'onboarding@resend.dev';
    
    console.log(`Enviando e-mail para ${to} com assunto "${subject}"`);
    
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text
    });
    
    if (error) {
      console.error('Erro ao enviar e-mail:', error);
      return false;
    }
    
    console.log('E-mail enviado com sucesso, ID:', data?.id);
    return true;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    return false;
  }
}

// Templates de e-mail

/**
 * Gera um e-mail para lembrar o parceiro sobre uma tarefa doméstica
 */
export function generateTaskReminderEmail(
  partnerName: string,
  senderName: string,
  taskTitle: string,
  taskDescription: string | null,
  customMessage: string | null,
  taskId: number
): { html: string; text: string } {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const taskUrl = `${baseUrl}/tasks/${taskId}`;
  
  const message = customMessage 
    ? `<p>${customMessage}</p>` 
    : `<p>${senderName} está te lembrando sobre esta tarefa importante.</p>`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Lembrete de Tarefa Doméstica</h1>
      <p>Olá ${partnerName},</p>
      ${message}
      <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0;">
        <h2 style="margin-top: 0; color: #1f2937;">${taskTitle}</h2>
        ${taskDescription ? `<p style="color: #4b5563;">${taskDescription}</p>` : ''}
      </div>
      <a href="${taskUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 16px;">Ver Tarefa</a>
      <p style="margin-top: 32px; font-size: 0.875rem; color: #6b7280;">
        Este é um lembrete automático enviado pelo aplicativo NossaRotina.
      </p>
    </div>
  `;
  
  const text = `
Lembrete de Tarefa Doméstica

Olá ${partnerName},

${customMessage || `${senderName} está te lembrando sobre esta tarefa importante.`}

TAREFA: ${taskTitle}
${taskDescription ? `DESCRIÇÃO: ${taskDescription}` : ''}

Para ver a tarefa, acesse: ${taskUrl}

Este é um lembrete automático enviado pelo aplicativo NossaRotina.
  `;
  
  return { html, text };
}