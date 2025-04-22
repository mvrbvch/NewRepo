import React from "react";
import { NotificationTestPanel } from "@/components/shared/notification-test-panel";
import { PageContainer } from "@/components/shared/page-container";

/**
 * Página para testar e diagnosticar o sistema de notificações
 */
export default function NotificationTestPage() {
  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Teste de Notificações</h1>
        <p className="text-muted-foreground mb-8">
          Use esta página para testar o sistema de notificações push da aplicação e diagnosticar problemas.
          Você pode enviar notificações de teste para o seu dispositivo atual e verificar a configuração do sistema.
        </p>
        
        <NotificationTestPanel />
      </div>
    </PageContainer>
  );
}