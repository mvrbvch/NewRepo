import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateAuthenticationOptionsOpts,
  GenerateRegistrationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifyRegistrationResponseOpts,
} from "@simplewebauthn/server";
import { isBefore } from "date-fns";
import { db } from "./db";
import {
  webAuthnChallenges,
  webAuthnCredentials,
  users,
  insertWebAuthnChallengeSchema,
  insertWebAuthnCredentialSchema,
  WebAuthnCredential,
  WebAuthnChallenge,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Configurações gerais do WebAuthn
// Estas variáveis seriam melhores em variáveis de ambiente
const rpName = "Nós Juntos"; // Nome da entidade que está registrando a credencial
const rpID =
  process.env.RP_ID ||
  "localhost" ||
  "192.168.68.105" ||
  "sharp-oyster-fleet.ngrok-free.app"; // No ambiente de produção, use o domínio real
const expectedOrigin =
  process.env.EXPECTED_ORIGIN ||
  `https://${rpID}` ||
  "http://192.168.68.105" ||
  "https://sharp-oyster-fleet.ngrok-free.app";

/**
 * Gera opções para registro de uma nova credencial WebAuthn
 */
export async function generateWebAuthnRegistrationOptions(
  userId: number,
  username: string,
  existingCredentials: WebAuthnCredential[] = []
) {
  // Opções para registro
  const options: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    // Converte o userId numérico para Uint8Array para compatibilidade com a versão mais recente de SimpleWebAuthn
    userID: new Uint8Array(Buffer.from(userId.toString())),
    userName: username,
    attestationType: "none",
    // Filtra as credenciais existentes do usuário
    excludeCredentials: existingCredentials.map((cred) => ({
      id: Buffer.from(cred.credentialId, "base64url").toString("base64url"),
      type: "public-key",
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    })),
    // Especifica que preferimos credenciais baseadas em plataforma (Touch ID/Face ID)
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      requireResidentKey: true,
      userVerification: "preferred",
    },
  };

  // Gera as opções com o desafio
  const registrationOptions = await generateRegistrationOptions(options);

  // Armazena o desafio no banco de dados
  // Será usado posteriormente para verificar a resposta
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Válido por 15 minutos - ampliado para dar mais tempo ao usuário

  await db.insert(webAuthnChallenges).values({
    userId,
    challenge: registrationOptions.challenge,
    expiresAt,
  });

  return registrationOptions;
}

/**
 * Verifica a resposta de registro da credencial WebAuthn
 */
export async function verifyWebAuthnRegistration(
  userId: number,
  response: any, // Este é o objeto enviado pelo cliente
  deviceName: string
): Promise<{ verified: boolean; credential?: WebAuthnCredential }> {
  try {
    console.log("=== INICIANDO VERIFICAÇÃO DE REGISTRO WEBAUTHN ===");
    console.log("UserID:", userId);
    console.log("Device Name:", deviceName);
    console.log("Objeto response:", JSON.stringify(response, null, 2));

    // Busca o desafio mais recente do usuário
    const [challenge] = await db
      .select()
      .from(webAuthnChallenges)
      .where(eq(webAuthnChallenges.userId, userId))
      .orderBy(webAuthnChallenges.createdAt)
      .limit(1);

    if (!challenge) {
      console.error("Nenhum desafio encontrado para o usuário");
      return { verified: false };
    }

    console.log("Desafio encontrado:", JSON.stringify(challenge, null, 2));

    // Verifica se o desafio ainda é válido
    const now = new Date();
    if (isBefore(challenge.expiresAt, now)) {
      console.error("Desafio expirado");
      return { verified: false };
    }

    // Opções para verificação do registro
    const verifyOptions: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: challenge.challenge, // O desafio que tínhamos armazenado
      expectedOrigin:
        process.env.NODE_ENV === "development"
          ? [
              "http://localhost:5000",
              "https://localhost:5000",
              "http://192.168.68.105:5000",
              "https://sharp-oyster-fleet.ngrok-free.app",
              ...expectedOrigin.split(","),
            ]
          : expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
    };

    // Determinamos quais origens são aceitáveis para desenvolvimento
    const allowedOrigins =
      process.env.NODE_ENV === "development"
        ? [
            "http://localhost:5000",
            "https://localhost:5000",
            "http://192.168.68.105:5000",
            ...expectedOrigin.split(","),
          ]
        : expectedOrigin;

    console.log(
      "Opções de verificação:",
      JSON.stringify(
        {
          expectedChallenge: challenge.challenge,
          expectedOrigin: allowedOrigins,
          expectedRPID: rpID,
          requireUserVerification: true,
        },
        null,
        2
      )
    );

    // Verifica a resposta
    console.log("Chamando verifyRegistrationResponse...");
    let verification;
    try {
      verification = await verifyRegistrationResponse(verifyOptions);
      console.log(
        "Verificação bem-sucedida:",
        JSON.stringify(verification, null, 2)
      );
    } catch (error) {
      console.error("ERRO na verificação WebAuthn:", error);
      // Analisar o erro detalhadamente
      if (error instanceof Error) {
        console.error("Nome do erro:", error.name);
        console.error("Mensagem do erro:", error.message);
        console.error("Stack trace:", error.stack);
      }
      return { verified: false };
    }

    // Se a verificação falhar, retorna erro
    if (!verification.verified || !verification.registrationInfo) {
      console.error(
        "Verificação falhou:",
        JSON.stringify(verification, null, 2)
      );
      return { verified: false };
    }

    // Extrai informações da verificação
    // Na versão mais recente da biblioteca, os campos estão dentro do objeto credential
    // Adicionamos logs para entender a estrutura do objeto
    console.log(
      "Estrutura do objeto de verificação:",
      JSON.stringify({
        verificado: verification.verified,
        info: Object.keys(verification.registrationInfo),
        credentialKeys: verification.registrationInfo.credential
          ? Object.keys(verification.registrationInfo.credential)
          : null,
      })
    );

    // Extraindo dados da credencial
    const credentialID = verification.registrationInfo.credential?.id;
    const credentialPublicKey =
      verification.registrationInfo.credential?.publicKey;
    // Contador inicia em 0, a versão mais recente não retorna este valor na verificação
    const counter = 0;

    // Extrai informações da credencial para o transporte e autenticador
    const transports = response.response.transports;
    const credentialDeviceType =
      verification.registrationInfo.credentialDeviceType;
    const credentialBackedUp = verification.registrationInfo.credentialBackedUp;
    const authenticatorAttachment = response.authenticatorAttachment;

    // Salva a credencial
    const [savedCredential] = await db
      .insert(webAuthnCredentials)
      .values({
        userId,
        credentialId: Buffer.from(credentialID).toString("base64url"),
        publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        // Convertemos arrays para string JSON para armazenamento
        transports: transports ? JSON.stringify(transports) : null,
        authenticatorAttachment,
        deviceName: deviceName || "Dispositivo desconhecido",
      })
      .returning();

    // Limpa o desafio utilizado
    await db
      .delete(webAuthnChallenges)
      .where(eq(webAuthnChallenges.id, challenge.id));

    return {
      verified: true,
      credential: savedCredential,
    };
  } catch (error) {
    console.error("Erro ao verificar registro WebAuthn:", error);
    return { verified: false };
  }
}

/**
 * Gera opções para autenticação com WebAuthn
 */
export async function generateWebAuthnAuthenticationOptions(
  username: string,
  userVerification: "required" | "preferred" | "discouraged" = "preferred"
) {
  try {
    // Busca o usuário
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      console.error("Usuário não encontrado");
      return null;
    }

    // Busca as credenciais do usuário
    const credentials = await db
      .select()
      .from(webAuthnCredentials)
      .where(eq(webAuthnCredentials.userId, user.id));

    if (!credentials.length) {
      console.error("Nenhuma credencial encontrada para o usuário");
      return null;
    }

    // Gera as opções para autenticação
    const options: GenerateAuthenticationOptionsOpts = {
      rpID,
      userVerification,
      // Especifica quais credenciais são permitidas
      allowCredentials: credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, "base64url").toString("base64url"),
        type: "public-key",
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
    };

    const authenticationOptions = await generateAuthenticationOptions(options);

    // Armazena o desafio no banco de dados
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Válido por 15 minutos - ampliado para dar mais tempo ao usuário

    await db.insert(webAuthnChallenges).values({
      userId: user.id,
      challenge: authenticationOptions.challenge,
      expiresAt,
    });

    return {
      authenticationOptions,
      userId: user.id,
    };
  } catch (error) {
    console.error("Erro ao gerar opções de autenticação WebAuthn:", error);
    return null;
  }
}

/**
 * Verifica a resposta de autenticação WebAuthn
 */
export async function verifyWebAuthnAuthentication(
  userId: number,
  response: any // Este é o objeto enviado pelo cliente
): Promise<{ verified: boolean; user?: any }> {
  try {
    // Busca o desafio mais recente do usuário
    const [challenge] = await db
      .select()
      .from(webAuthnChallenges)
      .where(eq(webAuthnChallenges.userId, userId))
      .orderBy(webAuthnChallenges.createdAt)
      .limit(1);

    if (!challenge) {
      console.error("Nenhum desafio encontrado para o usuário");
      return { verified: false };
    }

    // Verifica se o desafio ainda é válido
    const now = new Date();
    if (isBefore(challenge.expiresAt, now)) {
      console.error("Desafio expirado");
      return { verified: false };
    }

    // Busca a credencial específica
    const credentialID = response.id;
    const [credential] = await db
      .select()
      .from(webAuthnCredentials)
      .where(
        and(
          eq(webAuthnCredentials.userId, userId),
          eq(webAuthnCredentials.credentialId, credentialID)
        )
      );

    if (!credential) {
      console.error("Credencial não encontrada");
      return { verified: false };
    }

    // Opções para verificação da autenticação
    const verifyOptions: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin:
        process.env.NODE_ENV === "development"
          ? [
              "http://localhost:5000",
              "https://localhost:5000",
              "http://192.168.68.105:5000",
              "https://sharp-oyster-fleet.ngrok-free.app",
              ...expectedOrigin.split(","),
            ]
          : expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: true,
      // Na versão mais recente do @simplewebauthn/server, usamos 'credential' com uma estrutura específica
      credential: {
        id: credential.credentialId,
        publicKey: Buffer.from(credential.publicKey, "base64url"),
        counter: credential.counter,
      },
    };

    // Verifica a resposta
    const verification = await verifyAuthenticationResponse(verifyOptions);

    // Se a verificação falhar, retorna erro
    if (!verification.verified) {
      console.error("Verificação falhou", verification);
      return { verified: false };
    }

    // Atualiza o contador da credencial
    if (verification.authenticationInfo.newCounter > credential.counter) {
      await db
        .update(webAuthnCredentials)
        .set({
          counter: verification.authenticationInfo.newCounter,
          lastUsed: new Date(),
        })
        .where(eq(webAuthnCredentials.id, credential.id));
    }

    // Limpa o desafio utilizado
    await db
      .delete(webAuthnChallenges)
      .where(eq(webAuthnChallenges.id, challenge.id));

    // Busca o usuário
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    return {
      verified: true,
      user,
    };
  } catch (error) {
    console.error("Erro ao verificar autenticação WebAuthn:", error);
    return { verified: false };
  }
}

/**
 * Busca todas as credenciais WebAuthn de um usuário
 */
export async function getUserWebAuthnCredentials(
  userId: number
): Promise<WebAuthnCredential[]> {
  try {
    const credentials = await db
      .select()
      .from(webAuthnCredentials)
      .where(eq(webAuthnCredentials.userId, userId));

    return credentials;
  } catch (error) {
    console.error("Erro ao buscar credenciais WebAuthn do usuário:", error);
    return [];
  }
}

/**
 * Remove uma credencial WebAuthn
 */
export async function removeWebAuthnCredential(
  userId: number,
  credentialId: string
): Promise<boolean> {
  try {
    const result = await db
      .delete(webAuthnCredentials)
      .where(
        and(
          eq(webAuthnCredentials.userId, userId),
          eq(webAuthnCredentials.credentialId, credentialId)
        )
      );

    return true;
  } catch (error) {
    console.error("Erro ao remover credencial WebAuthn:", error);
    return false;
  }
}
