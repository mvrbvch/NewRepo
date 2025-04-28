import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import InteractiveTutorial from "@/components/onboarding/interactive-tutorial";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Definindo o tipo de retorno explicitamente como Element
export default function InteractiveOnboardingPage(): React.ReactElement {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Verificar se o usuário já concluiu o tutorial antes
  useEffect(() => {
    const tutorialCompletedBefore = localStorage.getItem("tutorialCompleted");
    if (tutorialCompletedBefore === "true" && user) {
      navigate("/calendar");
    }
  }, [user, navigate]);

  // Mutação para completar o onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      // Marcar o tutorial como concluído no localStorage
      localStorage.setItem("tutorialCompleted", "true");
      
      // Completar o onboarding no servidor
      const response = await apiRequest("POST", "/api/onboarding/complete", {});
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      // Marcar que o onboarding foi completado recentemente para evitar redirecionamento circular
      sessionStorage.setItem("onboardingCompleted", "true");
      
      // Exibir notificação de sucesso
      toast({
        title: "Tudo pronto!",
        description: "Agora você já pode começar a usar o Nós Juntos.",
      });
      
      // Navegar para a página principal após um pequeno atraso
      setTimeout(() => {
        // Força a navegação direta para página de calendário
        window.location.href = "/calendar";
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível concluir a configuração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Manipulador para quando o tutorial for concluído
  const handleTutorialComplete = () => {
    setTutorialCompleted(true);
    completeOnboardingMutation.mutate();
  };

  // Manipulador para pular o tutorial
  const handleSkipTutorial = () => {
    setTutorialCompleted(true);
    completeOnboardingMutation.mutate();
  };

  // Se o usuário não estiver logado, mostrar uma tela de carregamento
  // O componente ProtectedRoute já lidará com o redirecionamento
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!tutorialCompleted && (
        <InteractiveTutorial 
          onComplete={handleTutorialComplete} 
          onSkip={handleSkipTutorial} 
        />
      )}
    </div>
  );
}