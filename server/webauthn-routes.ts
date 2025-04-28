import { Express, Request, Response } from "express";
import {
  generateWebAuthnRegistrationOptions,
  verifyWebAuthnRegistration,
  generateWebAuthnAuthenticationOptions,
  verifyWebAuthnAuthentication,
  getUserWebAuthnCredentials,
  removeWebAuthnCredential,
} from "./webauthn";

export function registerWebAuthnRoutes(app: Express) {
  // Rota para iniciar o registro de uma nova credencial biométrica
  app.post(
    "/api/webauthn/register-options",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      try {
        const userId = req.user?.id as number;
        const username = req.user?.username as string;

        // Buscar credenciais existentes do usuário
        const existingCredentials = await getUserWebAuthnCredentials(userId);

        // Gerar opções de registro
        const options = await generateWebAuthnRegistrationOptions(
          userId,
          username,
          existingCredentials
        );

        res.json(options);
      } catch (error) {
        console.error("Erro ao gerar opções de registro WebAuthn:", error);
        res.status(500).json({
          message: "Falha ao iniciar registro biométrico",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Rota para verificar e completar o registro de uma credencial
  app.post(
    "/api/webauthn/register-verify",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      try {
        const userId = req.user?.id as number;
        const { credential, deviceName } = req.body;

        if (!credential) {
          return res
            .status(400)
            .json({ message: "Dados de credencial faltando" });
        }

        // Verificar a resposta de registro
        const verification = await verifyWebAuthnRegistration(
          userId,
          credential,
          deviceName || "Meu dispositivo"
        );

        if (!verification.verified) {
          return res
            .status(400)
            .json({ message: "Falha na verificação da credencial" });
        }

        res.json({
          verified: true,
          credential: verification.credential,
        });
      } catch (error) {
        console.error("Erro ao verificar registro WebAuthn:", error);
        res.status(500).json({
          message: "Falha ao completar registro biométrico",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Rota para iniciar autenticação biométrica
  app.post(
    "/api/webauthn/login-options",
    async (req: Request, res: Response) => {
      try {
        const { username } = req.body;

        if (!username) {
          return res
            .status(400)
            .json({ message: "Nome de usuário é obrigatório" });
        }

        // Gerar opções de autenticação
        const options = await generateWebAuthnAuthenticationOptions(username);

        if (!options) {
          return res.status(400).json({
            message:
              "Falha ao gerar opções de autenticação. Verifique se o usuário existe e possui credenciais registradas.",
          });
        }

        res.json({
          options: options.authenticationOptions,
          userId: options.userId,
        });
      } catch (error) {
        console.error("Erro ao gerar opções de autenticação WebAuthn:", error);
        res.status(500).json({
          message: "Falha ao iniciar autenticação biométrica",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Rota para verificar autenticação biométrica
  app.post(
    "/api/webauthn/login-verify",
    async (req: Request, res: Response) => {
      try {
        const { credential, userId } = req.body;

        if (!credential || !userId) {
          return res
            .status(400)
            .json({ message: "Dados de autenticação incompletos" });
        }

        // Verificar a resposta de autenticação
        const verification = await verifyWebAuthnAuthentication(
          userId,
          credential
        );

        if (!verification.verified || !verification.user) {
          return res
            .status(401)
            .json({ message: "Falha na autenticação biométrica" });
        }

        // Login do usuário
        req.login(verification.user, (err) => {
          if (err) {
            console.error(
              "Erro ao fazer login após autenticação biométrica:",
              err
            );
            return res
              .status(500)
              .json({ message: "Falha ao completar o login" });
          }

          res.json({
            success: true,
            user: verification.user,
          });
        });
      } catch (error) {
        console.error("Erro ao verificar autenticação WebAuthn:", error);
        res.status(500).json({
          message: "Falha ao verificar autenticação biométrica",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Rota para listar credenciais biométricas do usuário
  app.get("/api/webauthn/credentials", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.user?.id as number;
      const credentials = await getUserWebAuthnCredentials(userId);

      res.json(credentials);
    } catch (error) {
      console.error("Erro ao buscar credenciais WebAuthn:", error);
      res.status(500).json({
        message: "Falha ao buscar credenciais biométricas",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Rota para remover uma credencial biométrica
  app.delete(
    "/api/webauthn/credentials/:id",
    async (req: Request, res: Response) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Não autorizado" });
      }

      try {
        const userId = req.user?.id as number;
        const credentialId = req.params.id;

        if (!credentialId) {
          return res
            .status(400)
            .json({ message: "ID da credencial é obrigatório" });
        }

        const result = await removeWebAuthnCredential(userId, credentialId);

        if (result) {
          res.json({ success: true });
        } else {
          res
            .status(404)
            .json({ message: "Credencial não encontrada ou já removida" });
        }
      } catch (error) {
        console.error("Erro ao remover credencial WebAuthn:", error);
        res.status(500).json({
          message: "Falha ao remover credencial biométrica",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );
}
