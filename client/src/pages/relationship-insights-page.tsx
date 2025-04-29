import React, { useState } from "react";
import { Route } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightList } from "@/components/relationship-insights/insight-list";
import { InsightDetail } from "@/components/relationship-insights/insight-detail";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export function RelationshipInsightsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { user, isLoading } = useAuth();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Se o usuário não estiver autenticado, mostra uma mensagem para fazer login
  if (!isLoading && !user) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">Insights de Relacionamento</h1>
        <p className="text-center text-gray-600 mb-6">
          Você precisa fazer login para acessar os insights de relacionamento.
        </p>
        <Button className="flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Fazer Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Route path="/insights">
        {() => (
          <>
            <h1 className="text-3xl font-bold mb-6">Insights de Relacionamento</h1>
            <p className="text-gray-600 mb-8">
              Insights personalizados baseados nos seus dados e interações com seu parceiro para 
              fortalecer seu relacionamento.
            </p>

            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="all">Todos os Insights</TabsTrigger>
                <TabsTrigger value="partner">Insights do Casal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="py-2">
                <InsightList type="all" />
              </TabsContent>
              
              <TabsContent value="partner" className="py-2">
                <InsightList type="partner" />
              </TabsContent>
            </Tabs>
          </>
        )}
      </Route>

      <Route path="/insights/:id">
        <InsightDetail />
      </Route>
    </div>
  );
}