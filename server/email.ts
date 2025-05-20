import { Resend } from "resend";
import { MailService } from "@sendgrid/mail";

// Configuração Resend
if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY não está definida. Usando SendGrid como alternativa para enviar e-mails."
  );
}

// Configuração SendGrid
if (process.env.SENDGRID_API_KEY) {
  console.log("Configurando SendGrid para envio de emails");
} else {
  console.warn(
    "SENDGRID_API_KEY não está definida. O sistema tentará usar Resend para envio de emails."
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Configurar SendGrid se a API key estiver disponível
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

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
    const from = options.from || "❤️ Nós Juntos <rotina@no-reply.murbach.work>";

    console.log(`Enviando e-mail para ${to} com assunto "${subject}"`);

    // Tenta primeiro com Resend e cai para SendGrid se não estiver disponível
    if (resend && process.env.RESEND_API_KEY) {
      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.warn(
          "Erro ao enviar e-mail com Resend, tentando SendGrid:",
          error
        );
      } else {
        console.log("E-mail enviado com sucesso via Resend, ID:", data?.id);
        return true;
      }
    }

    // Usar SendGrid como alternativa ou se Resend falhar
    if (process.env.SENDGRID_API_KEY) {
      await mailService.send({
        to,
        from,
        subject,
        text,
        html,
      });
      console.log("E-mail enviado com sucesso via SendGrid");
      return true;
    }

    console.error(
      "Não foi possível enviar o email. Nenhum serviço de email está configurado."
    );
    return false;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return false;
  }
}

/**
 * Gera um email para convidar alguém para ser parceiro no aplicativo
 */
export function generatePartnerInviteEmail(
  recipientEmail: string,
  inviterName: string,
  inviteToken: string
): { html: string; text: string } {
  const baseUrl = process.env.BASE_URL || "https://nos-juntos.replit.app";
  const inviteUrl = `${baseUrl}/auth?redirect=invite&token=${inviteToken}`;

  const html = `
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(to right, #ee5d60, #f0686b, #f17375, #f27e80, #f3888a, #f28687, #f08385, #ef8182, #eb7172, #e66162, #e05051, #da3e41); padding: 24px; text-align: center;">
      <div align="center"><img src="https://nosjuntos.online/logo-white.png" height="50" />
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Convite Especial do Nós Juntos ❤️</h1>  
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.5; color: #ffffff;">Ei, olha só que momento lindo!</p>
        <p style="font-size: 16px; line-height: 1.5; color: #ffffff;"><strong style="color: #ffffff;">${inviterName}</strong> quer te convidar para viver uma nova fase ao lado do amor da sua vida no aplicativo <strong style="color: #ffffff;">Nós Juntos</strong>! 🌟</p>
        <p style="font-size: 16px; line-height: 1.5; color: #ffffff;">Com o Nós Juntos, vocês vão poder organizar a rotina juntos, dividir tarefas, criar hábitos saudáveis e fortalecer ainda mais a parceria no dia a dia.</p>

        <div style="background-color: #fff; border-left: 4px solid #matheus.murbach+123123123@gmail.com; border-radius: 4px; padding: 16px; margin: 24px 0;">
          <p style="margin: 0; color: #ffffff;">Para aceitar o convite e começar essa jornada, clique no botão abaixo:</p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteUrl}" style="background: linear-gradient(to right, #ee5d60, #f0686b, #f17375, #f27e80, #f3888a, #f28687, #f08385, #ef8182, #eb7172, #e66162, #e05051, #da3e41);  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; transition: all 0.2s;">Aceitar Convite</a>
        </div>

        <p style="font-size: 14px; color: #ffffff; text-align: center;">Ou acesse este link: <a href="${inviteUrl}" style="color: #ffffff; text-decoration: underline;">${inviteUrl}</a></p>
      </div>
      
      <div style="background-color: #fff; padding: 16px 24px; border-top: 1px solid #ffffff;">
        <p style="margin: 0; font-size: 14px; color: #1A535C; text-align: center;">
          Se você não conhece ${inviterName} ou acredita que este convite foi enviado por engano, pode simplesmente ignorá-lo.
        </p>
      </div>
    </div>
  `;

  const text = `
Convite Especial do Nós Juntos ❤️

Ei, olha só que momento lindo!

${inviterName} quer te convidar para viver uma nova fase ao lado do amor da sua vida no aplicativo Nós Juntos! 🌟

Com o Nós Juntos, vocês vão poder organizar a rotina juntos, dividir tarefas, criar hábitos saudáveis e fortalecer ainda mais a parceria no dia a dia.

Para aceitar o convite e começar essa jornada, clique no link abaixo:
${inviteUrl}

Se você não conhece ${inviterName} ou acredita que este convite foi enviado por engano, pode simplesmente ignorá-lo.
  `;

  return { html, text };
}

export function generateTaskReminderEmail(
  partnerName: string,
  senderName: string,
  taskTitle: string,
  taskDescription: string | null,
  customMessage: string | null,
  taskId: number
): { html: string; text: string } {
  const baseUrl = process.env.BASE_URL || "https://nos-juntos.replit.app";
  const taskUrl = `${baseUrl}/tasks/${taskId}`;

  const message = customMessage
    ? `<p>${customMessage}</p>`
    : `<p>${senderName} está te lembrando com carinho dessa tarefinha importante 💡</p>`;

  const html = `
    <div style="font-family: 'Inter', 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(to right, #ee5d60, #f0686b, #f17375, #f27e80, #f3888a, #f28687, #f08385, #ef8182, #eb7172, #e66162, #e05051, #da3e41); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Ping! Você tem uma missão no Nós Juntos 💌</h1>
      </div>
      
      <div style="padding: 32px 24px;">
        <p style="margin-top: 0; font-size: 16px; line-height: 1.5; color: #4b5563;">Olá ${partnerName},</p>
        <div style="font-size: 16px; line-height: 1.5; color: #4b5563;">${message}</div>
        
        <div style="background-color: #f9fafb; border-left: 4px solid #8b5cf6; border-radius: 4px; padding: 16px; margin: 24px 0;">
          <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">${taskTitle}</h2>
          ${taskDescription ? `<p style="color: #4b5563; margin-bottom: 0;">${taskDescription}</p>` : ""}
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${taskUrl}" style="background: linear-gradient(to right, #ee5d60, #f0686b, #f17375, #f27e80, #f3888a, #f28687, #f08385, #ef8182, #eb7172, #e66162, #e05051, #da3e41); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; transition: all 0.2s;">Ver Tarefa</a>
        </div>
      </div>
      
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
          Este é um lembrete enviado com carinho pelo aplicativo Nós Juntos ❤️
        </p>
      </div>
    </div>
  `;

  const text = `
Lembrete de Tarefa no Nós Juntos 💌

Olá ${partnerName},

${customMessage || `${senderName} está te lembrando com carinho dessa tarefinha importante.`}

Tarefa: ${taskTitle}
${taskDescription ? `Descrição: ${taskDescription}` : ""}

Veja a tarefa aqui: ${taskUrl}

Este é um lembrete enviado com carinho pelo app Nós Juntos ❤️
  `;

  return { html, text };
}
