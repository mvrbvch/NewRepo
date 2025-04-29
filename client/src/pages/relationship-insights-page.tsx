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
            <div className="bg-[#F27474] bg-opacity-10 rounded-md p-4 mb-6 border border-[#F27474] border-opacity-20">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-5 w-5 text-[#F27474]" />
                    <h1 className="text-xl font-bold text-[#F27474]">Insights de Relacionamento</h1>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Insights personalizados baseados nas interações com seu parceiro para fortalecer seu relacionamento.
                  </p>
                </div>
                <div className="p-2 bg-white rounded-full border border-[#F27474] border-opacity-20">
                  <Brain className="h-8 w-8 text-[#F27474]" />
                </div>
              </div>
            </div>
            
            <div className="flex overflow-x-auto gap-3 pb-2 mb-6 md:grid md:grid-cols-3 md:overflow-visible">
              <div className="min-w-[230px] md:min-w-0 bg-white rounded-md border border-gray-200 p-3">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-[#F27474] bg-opacity-10 rounded-full mb-2">
                    <Brain className="h-5 w-5 text-[#F27474]" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">Análise Inteligente</h3>
                  <p className="text-xs text-gray-600">
                    Nossa análise aprende e melhora com cada interação do casal.
                  </p>
                </div>
              </div>
              <div className="min-w-[230px] md:min-w-0 bg-white rounded-md border border-gray-200 p-3">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-[#F27474] bg-opacity-10 rounded-full mb-2">
                    <HeartHandshake className="h-5 w-5 text-[#F27474]" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">Conexão Mais Forte</h3>
                  <p className="text-xs text-gray-600">
                    Recomendações personalizadas para fortalecer seu relacionamento.
                  </p>
                </div>
              </div>
              <div className="min-w-[230px] md:min-w-0 bg-white rounded-md border border-gray-200 p-3">
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 bg-[#F27474] bg-opacity-10 rounded-full mb-2">
                    <Sparkles className="h-5 w-5 text-[#F27474]" />
                  </div>
                  <h3 className="font-medium text-sm mb-1">Sugestões Práticas</h3>
                  <p className="text-xs text-gray-600">
                    Ações práticas para melhorar seu relacionamento.
                  </p>
                </div>
              </div>
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