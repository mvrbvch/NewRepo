import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";

import type {
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
  GenerateRegistrationOptionsOpts,
} from "@simplewebauthn/server";

import { isBefore } from "date-fns";
import { db } from "./db";
import {
  webAuthnChallenges,
  webAuthnCredentials,
  users,
  WebAuthnCredential,
} from "@shared/schema";

import { eq, and, desc } from "drizzle-orm";

const rpName = "Nós Juntos";
const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.EXPECTED_ORIGIN || `http://${rpID}:5001`;

export async function generateWebAuthnRegistrationOptions(
  userId: number,
  username: string,
  existingCredentials: WebAuthnCredential[] = []
) {
  const options: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: Buffer.from(userId.toString()),
    userName: username,
    attestationType: "none",
    excludeCredentials: existingCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports ? JSON.parse(cred.transports) : undefined,
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      requireResidentKey: true,
      userVerification: "required",
    },
  };

  const registrationOptions = await generateRegistrationOptions(options);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5);

  await db.insert(webAuthnChallenges).values({
    userId,
    challenge: registrationOptions.challenge,
    expiresAt,
  });

  return registrationOptions;
}

export async function verifyWebAuthnRegistration(
  userId: number,
  response: RegistrationResponseJSON,
  deviceName: string
): Promise<{ verified: boolean; credential?: WebAuthnCredential }> {
  try {
    const [challenge] = await db
      .select()
      .from(webAuthnChallenges)
      .where(eq(webAuthnChallenges.userId, userId))
      .orderBy(desc(webAuthnChallenges.createdAt))
      .limit(1);

    if (!challenge || isBefore(challenge.expiresAt, new Date())) {
      console.error("Desafio inválido ou expirado");
      return { verified: false };
    }

    const verifyOptions: VerifyRegistrationResponseOpts = {
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    };

    const verification = await verifyRegistrationResponse(verifyOptions);

    if (!verification.verified || !verification.registrationInfo) {
      console.error("Falha na verificação", verification);
      return { verified: false };
    }

    const { credentialDeviceType, credentialBackedUp, credential } =
      verification.registrationInfo;

    const credentialPublicKey = credential.publicKey;

    // Adicione c e log
    if (!credential.id || !credentialPublicKey) {
      console.error("credentialID ou credentialPublicKey indefinido!", {
        credentialID: credential.id,
        credentialPublicKey,
        registrationInfo: verification.registrationInfo,
      });
      return { verified: false };
    }

    const transports = response.response.transports;
    const authenticatorAttachment = response.authenticatorAttachment;

    const [savedCredential] = await db
      .insert(webAuthnCredentials)
      .values({
        userId,
        credentialId: Buffer.from(credential.id).toString("base64url"),
        publicKey: Buffer.from(credentialPublicKey).toString("base64url"),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: transports ? JSON.stringify(transports) : null,
        authenticatorAttachment,
        deviceName: deviceName || "Dispositivo desconhecido",
      })
      .returning();

    await db
      .delete(webAuthnChallenges)
      .where(eq(webAuthnChallenges.id, challenge.id));

    return { verified: true, credential: savedCredential };
  } catch (error) {
    console.error("Erro ao verificar registro WebAuthn:", error);
    return { verified: false };
  }
}

export async function generateWebAuthnAuthenticationOptions(
  username: string,
  userVerification: "required" | "preferred" | "discouraged" = "required"
) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    console.log("user", user);
    if (!user) {
      console.error("Usuário não encontrado");
      return null;
    }

    const credentials = await db
      .select()
      .from(webAuthnCredentials)
      .where(eq(webAuthnCredentials.userId, user.id));

    if (!credentials.length) {
      console.error("Nenhuma credencial encontrada para o usuário");
      return null;
    }

    const authenticationOptions = await generateAuthenticationOptions({
      rpID,
      userVerification,
      allowCredentials: credentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports ? JSON.parse(cred.transports) : undefined,
      })),
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await db.insert(webAuthnChallenges).values({
      userId: user.id,
      challenge: authenticationOptions.challenge,
      expiresAt,
    });

    return { authenticationOptions, userId: user.id };
  } catch (error) {
    console.error("Erro ao gerar opções de autenticação WebAuthn:", error);
    return null;
  }
}

export async function verifyWebAuthnAuthentication(
  userId: number,
  response: AuthenticationResponseJSON
): Promise<{ verified: boolean; user?: any }> {
  try {
    const [challenge] = await db
      .select()
      .from(webAuthnChallenges)
      .where(eq(webAuthnChallenges.userId, userId))
      .orderBy(desc(webAuthnChallenges.createdAt))
      .limit(1);

    if (!challenge || isBefore(challenge.expiresAt, new Date())) {
      console.error("Desafio inválido ou expirado");
      return { verified: false };
    }

    const [credential] = await db
      .select()
      .from(webAuthnCredentials)
      .where(
        and(
          eq(webAuthnCredentials.userId, userId),
          eq(webAuthnCredentials.credentialId, response.id)
        )
      );

    if (!credential) {
      console.error("Credencial não encontrada");
      return { verified: false };
    }

    const verifyOptions: VerifyAuthenticationResponseOpts = {
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
      authenticator: {
        credentialID: Buffer.from(credential.credentialId, "base64url"),
        credentialPublicKey: Buffer.from(credential.publicKey, "base64url"),
        counter: credential.counter,
      },
    };

    const verification = await verifyAuthenticationResponse(verifyOptions);

    if (!verification.verified) {
      console.error("Falha na verificação de autenticação", verification);
      return { verified: false };
    }

    if (verification.authenticationInfo.newCounter > credential.counter) {
      await db
        .update(webAuthnCredentials)
        .set({
          counter: verification.authenticationInfo.newCounter,
          lastUsed: new Date(),
        })
        .where(eq(webAuthnCredentials.id, credential.id));
    }

    await db
      .delete(webAuthnChallenges)
      .where(eq(webAuthnChallenges.id, challenge.id));

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    return { verified: true, user };
  } catch (error) {
    console.error("Erro ao verificar autenticação WebAuthn:", error);
    return { verified: false };
  }
}

export async function getUserWebAuthnCredentials(
  userId: number
): Promise<WebAuthnCredential[]> {
  try {
    return await db
      .select()
      .from(webAuthnCredentials)
      .where(eq(webAuthnCredentials.userId, userId));
  } catch (error) {
    console.error("Erro ao buscar credenciais:", error);
    return [];
  }
}

export async function removeWebAuthnCredential(
  userId: number,
  credentialId: string
): Promise<boolean> {
  try {
    await db
      .delete(webAuthnCredentials)
      .where(
        and(
          eq(webAuthnCredentials.userId, userId),
          eq(webAuthnCredentials.credentialId, credentialId)
        )
      );
    return true;
  } catch (error) {
    console.error("Erro ao remover credencial:", error);
    return false;
  }
}
