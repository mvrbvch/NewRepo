import React, { useState } from "react";
import { Route } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightList } from "@/components/relationship-insights/insight-list";
import { InsightDetail } from "@/components/relationship-insights/insight-detail";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Brain, HeartHandshake, Lightbulb, Sparkles } from "lucide-react";

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
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-8 mb-10 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                    <h1 className="text-3xl font-bold text-primary/90">Insights de Relacionamento</h1>
                  </div>
                  <p className="text-gray-600 max-w-2xl">
                    Nossos algoritmos analisam seus dados e interações com seu parceiro para 
                    fornecer insights personalizados que ajudam a fortalecer seu relacionamento.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-full shadow-lg">
                  <Brain className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-100 rounded-full mb-3">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Análise Inteligente</h3>
                    <p className="text-sm text-gray-600">
                      Nosso sistema aprende e melhora com cada interação, oferecendo insights cada vez mais relevantes.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50/50 border-green-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-green-100 rounded-full mb-3">
                      <HeartHandshake className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Conexão Mais Forte</h3>
                    <p className="text-sm text-gray-600">
                      Recomendações personalizadas para ajudar a fortalecer a conexão entre você e seu parceiro.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-purple-50/50 border-purple-100 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-purple-100 rounded-full mb-3">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold mb-2">Sugestões Práticas</h3>
                    <p className="text-sm text-gray-600">
                      Ações concretas que você pode tomar para melhorar seu relacionamento com base nos insights.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="mb-6 shadow-sm">
                <TabsTrigger value="all" className="font-medium">Todos os Insights</TabsTrigger>
                <TabsTrigger value="partner" className="font-medium">Insights do Casal</TabsTrigger>
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