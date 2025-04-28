import { Express, Request, Response } from "express";
import { db } from "./db";
import { nativeBiometricCredentials, users } from "@shared/schema";
import { and, eq } from "drizzle-orm";

/**
 * Registra as rotas para autenticação biométrica nativa em dispositivos iOS e Android
 * 
 * Estas rotas são separadas das WebAuthn, já que a implementação nativa é diferente
 * e não segue o mesmo padrão de desafio/resposta do WebAuthn.
 */
export function registerNativeBiometricRoutes(app: Express) {
  // Rota para registrar uma nova credencial biométrica nativa
  app.post('/api/native-biometric/register', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    try {
      const userId = req.user?.id as number;
      const { deviceName, biometricId, platform } = req.body;
      
      if (!deviceName || !biometricId || !platform) {
        return res.status(400).json({ message: "Dados incompletos para registro" });
      }
      
      // Validar a plataforma
      if (platform !== 'ios' && platform !== 'android') {
        return res.status(400).json({ message: "Plataforma inválida" });
      }
      
      // Verificar se já existe uma credencial com o mesmo ID
      const existingCredential = await db
        .select()
        .from(nativeBiometricCredentials)
        .where(eq(nativeBiometricCredentials.biometricId, biometricId))
        .limit(1);
      
      if (existingCredential.length > 0) {
        return res.status(400).json({ message: "Este dispositivo já está registrado" });
      }
      
      // Salvar a nova credencial
      const [savedCredential] = await db
        .insert(nativeBiometricCredentials)
        .values({
          userId,
          deviceName,
          biometricId,
          platform,
          lastUsed: new Date()
        })
        .returning();
      
      res.json({
        success: true,
        credential: savedCredential
      });
    } catch (error) {
      console.error('Erro ao registrar biometria nativa:', error);
      res.status(500).json({ 
        message: "Falha ao registrar biometria",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para login com biometria nativa
  app.post('/api/native-biometric/login', async (req: Request, res: Response) => {
    try {
      const { username, biometricId } = req.body;
      
      if (!username || !biometricId) {
        return res.status(400).json({ message: "Dados incompletos para autenticação" });
      }
      
      // Buscar o usuário pelo nome de usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      
      if (!user) {
        return res.status(401).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se existe uma credencial biométrica associada
      const [credential] = await db
        .select()
        .from(nativeBiometricCredentials)
        .where(
          and(
            eq(nativeBiometricCredentials.userId, user.id),
            eq(nativeBiometricCredentials.biometricId, biometricId)
          )
        );
      
      if (!credential) {
        return res.status(401).json({ message: "Credencial biométrica não encontrada" });
      }
      
      // Atualizar último acesso
      await db
        .update(nativeBiometricCredentials)
        .set({ lastUsed: new Date() })
        .where(eq(nativeBiometricCredentials.id, credential.id));
      
      // Fazer login
      req.login(user, (err) => {
        if (err) {
          console.error('Erro ao fazer login com biometria nativa:', err);
          return res.status(500).json({ message: "Falha ao completar o login" });
        }
        
        res.json({ 
          success: true,
          user 
        });
      });
    } catch (error) {
      console.error('Erro ao verificar autenticação biométrica nativa:', error);
      res.status(500).json({ 
        message: "Falha ao verificar autenticação biométrica",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para listar credenciais biométricas nativas do usuário
  app.get('/api/native-biometric/credentials', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    try {
      const userId = req.user?.id as number;
      const credentials = await db
        .select()
        .from(nativeBiometricCredentials)
        .where(eq(nativeBiometricCredentials.userId, userId));
      
      res.json(credentials);
    } catch (error) {
      console.error('Erro ao buscar credenciais biométricas nativas:', error);
      res.status(500).json({ 
        message: "Falha ao buscar credenciais biométricas",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Rota para remover uma credencial biométrica nativa
  app.delete('/api/native-biometric/credentials/:id', async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    
    try {
      const userId = req.user?.id as number;
      const credentialId = parseInt(req.params.id);
      
      if (isNaN(credentialId)) {
        return res.status(400).json({ message: "ID da credencial inválido" });
      }
      
      const result = await db
        .delete(nativeBiometricCredentials)
        .where(
          and(
            eq(nativeBiometricCredentials.userId, userId),
            eq(nativeBiometricCredentials.id, credentialId)
          )
        );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao remover credencial biométrica nativa:', error);
      res.status(500).json({ 
        message: "Falha ao remover credencial biométrica",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}