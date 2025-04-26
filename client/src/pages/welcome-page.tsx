import * as React from "react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import WelcomeScreen from "@/components/welcome/welcome-screen";

const WelcomePage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();

  // Função chamada quando o usuário completa a tela de boas-vindas
  const handleWelcomeComplete = async () => {
    try {
      // Aqui podemos implementar uma chamada para a API para registrar 
      // que o usuário completou a tela de boas-vindas, mas por enquanto 
      // apenas redirecionamos

      // Redirecionar para a página inicial
      setLocation("/");
    } catch (error) {
      console.error("Erro ao completar tela de boas-vindas:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <WelcomeScreen onComplete={handleWelcomeComplete} />
    </div>
  );
};

export default WelcomePage;