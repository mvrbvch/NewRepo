import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "RESEND_API_KEY não está definida. Não será possível enviar e-mails.",
  );
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
    const from = "💜 Nós Juntos <rotina@no-reply.murbach.work>";

    console.log(`Enviando e-mail para ${to} com assunto "${subject}"`);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Erro ao enviar e-mail:", error);
      return false;
    }

    console.log("E-mail enviado com sucesso, ID:", data?.id);
    return true;
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
  inviteToken: string,
): { html: string; text: string } {
  const baseUrl =
    process.env.BASE_URL || "https://unidus-clone-mvrbvch.replit.app";
  const inviteUrl = `${baseUrl}/accept-invite/${inviteToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Convite Especial do Nós Juntos 💜</h1>
      <p>Ei, olha só que momento lindo!</p>
      <p><strong>${inviterName}</strong> quer te convidar para viver uma nova fase ao lado do amor da sua vida no aplicativo <strong>Nós Juntos</strong>! 🌟</p>
      <p>Com o Nós Juntos, vocês vão poder organizar a rotina juntos, dividir tarefas, criar hábitos saudáveis e fortalecer ainda mais a parceria no dia a dia.</p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 16px; margin: 24px 0;">
        <p style="margin-top: 0; color: #4b5563;">Para aceitar o convite e começar essa jornada, clique no botão abaixo:</p>
      </div>

      <a href="${inviteUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 16px;">Aceitar Convite</a>

      <p style="margin-top: 24px; color: #4b5563;">Ou acesse este link: <a href="${inviteUrl}" style="color: #4f46e5;">${inviteUrl}</a></p>

      <p style="margin-top: 32px; font-size: 0.875rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        Se você não conhece ${inviterName} ou acredita que este convite foi enviado por engano, pode simplesmente ignorá-lo.
      </p>
    </div>
  `;

  const text = `
Convite Especial do Nós Juntos 💜

Ei! ${inviterName} quer te convidar para viver uma nova fase ao lado do amor da sua vida no app Nós Juntos!

Com o Nós Juntos, vocês organizam a rotina, dividem as tarefas e constroem juntos uma vida mais leve, conectada e cheia de amor.

Para aceitar o convite, acesse: ${inviteUrl}

Se não reconhecer este convite, é só ignorar. 😉
  `;

  return { html, text };
}

/**
 * Gera um e-mail para lembrar o parceiro sobre uma tarefa doméstica
 */
export function generateTaskReminderEmail(
  partnerName: string,
  senderName: string,
  taskTitle: string,
  taskDescription: string | null,
  customMessage: string | null,
  taskId: number,
): { html: string; text: string } {
  const baseUrl =
    process.env.BASE_URL || "https://unidus-clone-mvrbvch.replit.app/";
  const taskUrl = `${baseUrl}/tasks/${taskId}`;

  const message = customMessage
    ? `<p>${customMessage}</p>`
    : `<p>${senderName} está te lembrando com carinho dessa tarefinha importante 💡</p>`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4f46e5;">Ping! Você tem uma missão no Nós Juntos 💌</h1>
      <p>Olá ${partnerName},</p>
      ${message}
      <div style="background-color: #f9fafb; border-left: 4px solid #4f46e5; padding: 16px; margin: 24px 0;">
        <h2 style="margin-top: 0; color: #1f2937;">${taskTitle}</h2>
        ${taskDescription ? `<p style="color: #4b5563;">${taskDescription}</p>` : ""}
      </div>
      <a href="${taskUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 16px;">Ver Tarefa</a>
      <p style="margin-top: 32px; font-size: 0.875rem; color: #6b7280;">
        Este é um lembrete enviado com carinho pelo aplicativo Nós Juntos 💜
      </p>
    </div>
  `;

  const text = `
Lembrete de Tarefa no Por Nós 💌

Olá ${partnerName},

${customMessage || `${senderName} está te lembrando com carinho dessa tarefinha importante.`}

Tarefa: ${taskTitle}
${taskDescription ? `Descrição: ${taskDescription}` : ""}

Veja a tarefa aqui: ${taskUrl}

Este é um lembrete enviado com carinho pelo app Por Nós 💜
  `;

  return { html, text };
}
