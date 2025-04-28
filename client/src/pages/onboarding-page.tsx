import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  CalendarDays,
  Users,
  Home,
  Bell,
  Heart,
} from "lucide-react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [isFromInvite, setIsFromInvite] = useState(false);
  const [inviterName, setInviterName] = useState("");

  // Extrair o token de convite e as informações adicionais da URL, se existir
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get("token");
  const inviterNameFromURL = urlParams.get("name");

  // Inicializamos o partnerEmail com o valor que pode vir na URL
  useEffect(() => {
    // Se existe um email na URL (de um convite), usamos ele
    const emailFromURL = urlParams.get("email");
    if (emailFromURL) {
      setPartnerEmail(emailFromURL);
    }

    // Se existe um nome do invitador na URL, usamos ele
    if (inviterNameFromURL) {
      setInviterName(inviterNameFromURL);
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
      navigate("/calendar");

      // Se o usuário atual não for o convidado (não deve acontecer nesta página)
      if (inviteData.inviterEmail === user?.email) {
        toast({
          title: "Convite inválido",
          description: "Você não pode aceitar seu próprio convite.",
          variant: "destructive",
        });
      }
    }
  }, [inviteFound, inviteData, user, navigate, toast]);

  // Variantes de animação
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: i * 0.1,
        ease: "easeOut",
      },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 },
    },
  };

  const iconAnimation = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      },
    },
  };

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
      setTimeout(() => {
        navigate("/calendar");
      }, 800);
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

  const nextStep = () => {
    if (step === 2) {
      completeOnboardingMutation.mutate();
    } else {
      setStep(step + 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  return (
    <div className="h-full flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-tr from-primary/5 via-background to-primary/5">
      {/* Elementos decorativos de fundo */}
      <motion.div
        className="absolute top-[5%] right-[-15%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.2, 0.4],
          x: [0, 20, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <motion.div
        className="absolute bottom-[5%] left-[-15%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -20, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2,
        }}
      />

      <motion.div
        className="absolute top-[40%] right-[40%] w-[15rem] h-[15rem] rounded-full bg-rose-500/5 blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 1,
        }}
      />

      {/* Cabeçalho */}
      <div className="flex justify-between px-6 pt-5">
        <div className="flex space-x-2">
          <div
            className={`h-1.5 w-10 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-1.5 w-10 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={skipOnboarding}
        >
          Pular
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 py-6">
        <div className="w-full max-w-md">
          {step === 1 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
              className="text-center mb-6"
            >
              <motion.div
                variants={iconAnimation}
                className="bg-gradient-to-br from-primary/20 to-primary/5 inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 shadow-lg shadow-primary/10"
              >
                {isFromInvite ? (
                  <Heart className="text-rose-500 h-12 w-12" />
                ) : (
                  <Users className="text-primary h-12 w-12" />
                )}
              </motion.div>

              <motion.h2
                variants={cardVariants}
                custom={0}
                className="text-2xl font-bold mb-3"
              >
                {isFromInvite
                  ? `${inviterName} te convidou para o Nós Juntos!`
                  : "Bem-vindo(a) ao Nós Juntos!"}
              </motion.h2>

              <motion.div
                variants={cardVariants}
                custom={1}
                className="text-muted-foreground mb-8 space-y-3"
              >
                {isFromInvite ? (
                  <>
                    <p>
                      Que incrível! Você recebeu um convite especial de{" "}
                      <span className="text-rose-500 font-medium">
                        {inviterName}
                      </span>{" "}
                      <span className="text-rose-500">💌</span>
                    </p>
                    <p>
                      Isso é um sinal de que vocês estão prontos para organizar
                      a vida a dois com mais conexão, harmonia e propósito!
                    </p>
                    <p>
                      Juntos, vocês poderão compartilhar calendários, dividir
                      tarefas domésticas e se comunicar de forma mais eficiente.{" "}
                      <span className="text-primary">✨</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      Se você está se cadastrando, é porque decidiu dar um
                      upgrade na vida <span className="text-primary">💫</span> —
                      ao lado do amor da sua vida{" "}
                      <span className="text-rose-500">❤️</span>!
                    </p>
                    <p>
                      É hora de construir uma nova rotina, criar hábitos
                      incríveis e organizar o caos com leveza, parceria e muito
                      amor.
                    </p>
                    <p>
                      Porque juntos, tudo flui melhor, fica mais divertido e tem
                      muito mais sentido!{" "}
                      <span className="text-primary">✨</span>
                    </p>
                  </>
                )}
              </motion.div>

              <motion.div className="grid gap-3 mb-8">
                <motion.div
                  variants={cardVariants}
                  custom={2}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Calendário Compartilhado</h3>
                      <p className="text-xs text-muted-foreground">
                        Visualize e organize eventos juntos
                      </p>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  custom={3}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Tarefas Domésticas</h3>
                      <p className="text-xs text-muted-foreground">
                        Divida e gerencie responsabilidades
                      </p>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  custom={4}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-2 rounded-full">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Notificações</h3>
                      <p className="text-xs text-muted-foreground">
                        Receba lembretes importantes
                      </p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={containerVariants}
              className="mb-6"
            >
              <div className="text-center">
                <motion.div
                  variants={iconAnimation}
                  className="bg-gradient-to-br from-primary/20 to-primary/5 inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 shadow-lg shadow-primary/10"
                >
                  {isFromInvite ? (
                    <Heart className="text-rose-500 h-12 w-12" />
                  ) : (
                    <Users className="text-primary h-12 w-12" />
                  )}
                </motion.div>

                <motion.h2
                  variants={cardVariants}
                  custom={0}
                  className="text-2xl font-bold mb-3"
                >
                  {isFromInvite
                    ? "Conexão com seu parceiro"
                    : "Convide seu parceiro(a)"}
                </motion.h2>

                <motion.div
                  variants={cardVariants}
                  custom={1}
                  className="text-muted-foreground mb-8 space-y-3"
                >
                  {isFromInvite ? (
                    <>
                      <p>
                        Conecte-se com{" "}
                        <span className="text-rose-500 font-medium">
                          {inviterName}
                        </span>{" "}
                        para compartilhar calendários, tarefas e mais!{" "}
                        <span className="text-rose-500">💞</span>
                      </p>
                      <p>
                        Ao aceitar este convite, vocês estarão unindo suas
                        agendas e seus espaços no aplicativo.
                      </p>
                      <p>
                        Pronto para dar início a essa jornada de organização a
                        dois? <span className="text-primary">✨</span>
                      </p>

                      <motion.div
                        variants={cardVariants}
                        custom={2}
                        className="mt-4 bg-rose-50 p-4 rounded-lg border border-rose-100"
                      >
                        <div className="flex items-center gap-2 text-rose-500 font-medium mb-1">
                          <Heart className="h-4 w-4" /> Convite de parceria
                        </div>
                        <p className="text-sm text-left">
                          <span className="font-medium">{inviterName}</span>{" "}
                          convidou você para se conectar no aplicativo Nós
                          Juntos. Ao aceitar, vocês terão acesso compartilhado a
                          calendários, tarefas domésticas e notificações como
                          parceiros.
                        </p>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <p>
                        Compartilhar seus planos e tarefas com seu parceiro vai
                        além da organização!
                      </p>
                      <p>
                        Se você está recebendo um convite, é sinal de que alguém
                        te ama muito <span className="text-rose-500">💌</span> e
                        acredita que vocês merecem viver algo ainda mais
                        especial juntos.
                      </p>
                      <p>
                        Alguém que quer dividir o melhor da vida com você — com
                        mais conexão, equilíbrio e alegria!{" "}
                        <span className="text-primary">🌈</span>
                        <span className="text-rose-500">💖</span>
                      </p>
                    </>
                  )}
                </motion.div>
              </div>

              {!isFromInvite && (
                <motion.div
                  variants={cardVariants}
                  custom={2}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email do parceiro(a)
                    </label>
                    <motion.div whileTap={{ scale: 0.99 }}>
                      <input
                        type="email"
                        value={partnerEmail}
                        onChange={(e) => setPartnerEmail(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-300 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md"
                        placeholder="Digite o email do seu parceiro(a)"
                      />
                    </motion.div>
                    <motion.p
                      variants={cardVariants}
                      custom={3}
                      className="text-xs text-muted-foreground mt-2"
                    >
                      Seu parceiro receberá um convite para se juntar a você no
                      Nós Juntos
                    </motion.p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Navegação */}
      <div className="p-5">
        <motion.div
          className="flex space-x-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {step > 1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="w-full"
              >
                Voltar
              </Button>
            </motion.div>
          )}

          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Button
              onClick={nextStep}
              className="w-full group relative overflow-hidden"
            >
              <motion.span
                initial={{ opacity: 1 }}
                whileHover={{
                  y: -20,
                  opacity: 0,
                  transition: { duration: 0.2 },
                }}
                className="inline-block"
              >
                {step === 2 ? "Concluir" : "Continuar"}
              </motion.span>

              <motion.span
                initial={{
                  opacity: 0,
                  y: 20,
                  position: "absolute",
                  left: "50%",
                  translateX: "-50%",
                }}
                whileHover={{
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.2 },
                }}
                className="inline-flex items-center gap-1"
              >
                {step === 2 ? (
                  <>
                    Começar <CheckCircle2 className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Próximo{" "}
                    <motion.span
                      initial={{ x: 0 }}
                      animate={{ x: [0, 3, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        repeatDelay: 1,
                      }}
                    >
                      →
                    </motion.span>
                  </>
                )}
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
