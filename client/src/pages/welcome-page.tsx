import * as React from "react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { UserType } from "@/lib/types";
import WelcomeScreen from "@/components/welcome/welcome-screen";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

// Definir o tipo de retorno explicitamente como JSX.Element
const WelcomePage = (): JSX.Element => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isFromInvite, setIsFromInvite] = useState(false);
  const [inviterName, setInviterName] = useState("");

  // Extrair o token de convite e as informações adicionais da URL, se existir
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get("token");
  const inviterNameFromURL = urlParams.get("name");
  const redirect = urlParams.get("redirect");

  // Inicializamos o partnerEmail com o valor que pode vir na URL
  useEffect(() => {
    // Se existe um email na URL (de um convite), usamos ele
    const emailFromURL = urlParams.get("email");
    if (emailFromURL) {
      setPartnerEmail(emailFromURL);
    }

    // Se existe um nome do invitador na URL ou o redirect é "invite", estamos em um fluxo de convite
    if (inviterNameFromURL || redirect === "invite") {
      setInviterName(inviterNameFromURL || "seu parceiro");
      setIsFromInvite(true);
    }
  }, []);

  // Buscar informações do convite se houver um token
  const { data: inviteData, isSuccess: inviteFound } = useQuery({
    queryKey: ["/api/invites", inviteToken],
    queryFn: async () => {
      if (!inviteToken) return null;
      try {
        const response = await apiRequest(
          "GET",
          `/api/invites/validate?token=${inviteToken}`
        );
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Erro ao validar convite:", error);
        return null;
      }
    },
    enabled: !!inviteToken,
  });

  // Configurar o estado com base no convite
  useEffect(() => {
    if (inviteFound && inviteData) {
      setIsFromInvite(true);
      setInviterName(inviteData.inviterName || "seu parceiro");
      
      // Se o usuário atual for o convidador (não o convidado)
      if (inviteData.inviterEmail === user?.email) {
        toast({
          title: "Convite inválido",
          description: "Você não pode aceitar seu próprio convite.",
          variant: "destructive",
        });
        
        // Redirecionar para o calendário após mostrar a mensagem
        setTimeout(() => {
          setLocation("/calendar");
        }, 1500);
      }
      
      // Se houver um e-mail do convidado, atualizar o estado
      if (inviteData.inviteeEmail) {
        setPartnerEmail(inviteData.inviteeEmail);
      }
    }
  }, [inviteFound, inviteData, user, setLocation, toast]);

  // Mutação para completar o onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      // Se o usuário veio de um convite, aceita o convite automaticamente
      if (isFromInvite && inviteToken) {
        try {
          // Primeiro, aceita o convite
          const acceptResponse = await apiRequest(
            "POST",
            `/api/invites/accept`,
            {
              token: inviteToken,
            }
          );

          if (!acceptResponse.ok) {
            throw new Error("Erro ao aceitar convite");
          }

          // Em seguida, completa o onboarding
          const onboardingResponse = await apiRequest(
            "POST",
            "/api/onboarding/complete",
            {
              inviteAccepted: true,
            }
          );

          return onboardingResponse.json();
        } catch (error) {
          console.error("Erro ao processar convite:", error);
          throw error;
        }
      } else {
        // Fluxo normal - apenas completa o onboarding com email do parceiro (se fornecido)
        const response = await apiRequest("POST", "/api/onboarding/complete", {
          partnerEmail: partnerEmail || undefined,
        });
        return response.json();
      }
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      // Marcar que o onboarding foi completado recentemente para evitar redirecionamento circular
      sessionStorage.setItem("onboardingCompleted", "true");
      
      setTimeout(() => {
        // Força a navegação direta, ignorando as proteções de rota que poderiam redirecionar de volta
        window.location.href = "/calendar";
      }, 1000);
      
      if (isFromInvite) {
        toast({
          title: "Conexão realizada!",
          description: `Você e ${inviterName} agora estão conectados no Nós Juntos.`,
        });
      } else {
        toast({
          title: "Tudo pronto!",
          description: "Você já pode começar a usar o Nós Juntos.",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: isFromInvite
          ? "Não foi possível conectar com seu parceiro. Tente novamente."
          : "Não foi possível concluir a configuração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função chamada quando o usuário completa a tela de boas-vindas
  const handleWelcomeComplete = async () => {
    try {
      // Executar mutação para completar o onboarding e registrar finalização da welcome
      completeOnboardingMutation.mutate();
    } catch (error) {
      console.error("Erro ao completar tela de boas-vindas:", error);
      toast({
        title: "Erro",
        description:
          "Não foi possível completar a configuração. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <WelcomeScreen
        onComplete={handleWelcomeComplete}
        partnerEmail={partnerEmail}
        setPartnerEmail={setPartnerEmail}
        isFromInvite={isFromInvite}
        inviterName={inviterName}
        user={user}
      />
    </div>
  );
};

export default WelcomePage;
