import React from 'react';
import { NotificationTestPanel } from '@/components/shared/notification-test-panel';
import { PageContainer } from '../components/shared/page-container';
import { Separator } from '@/components/ui/separator';

/**
 * Página para testar e diagnosticar o sistema de notificações
 */
export default function NotificationTestPage() {
  return (
    <PageContainer>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-4">Teste de Notificações</h1>
        <Separator className="my-4" />
        <p className="mb-6 text-muted-foreground">
          Use esta página para testar o funcionamento das notificações push no aplicativo.
          Você pode enviar notificações de teste para seu próprio dispositivo e verificar a configuração do sistema.
        </p>
        
        <NotificationTestPanel />
      </div>
    </PageContainer>
  );
}