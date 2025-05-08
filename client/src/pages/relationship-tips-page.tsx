import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TipList } from "@/components/relationship-tips/tip-list";
import { MessageCircle, BookHeart, Lightbulb } from "lucide-react";
import Header from "@/components/shared/header";

export default function RelationshipTipsPage() {
  const [tab, setTab] = useState("all");

  useEffect(() => {
    document.title = "Dicas de Relacionamento | Nós Juntos";
  }, []);

  return (
    <>
      <div
        className="container mx-auto p-4 w-full scroll-id"
        style={{ paddingTop: 130 }}
      >
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <BookHeart className="h-8 w-8 text-pink-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Dicas de Relacionamento
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Descubra insights personalizados para melhorar seu relacionamento
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
          <Tabs
            defaultValue="all"
            value={tab}
            onValueChange={setTab}
            className="w-full"
          >
            <div className="border-b pb-2 mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex gap-2 items-center">
                  <Lightbulb className="h-4 w-4" />
                  <span>Todas as Dicas</span>
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="flex gap-2 items-center"
                >
                  <BookHeart className="h-4 w-4" />
                  <span>Favoritas</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <TipList type="all" />
            </TabsContent>

            <TabsContent value="favorites" className="mt-0">
              <TipList type="favorites" />
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Dicas personalizadas para fortalecer seu relacionamento
          </p>
        </div>
      </div>
    </>
  );
}
