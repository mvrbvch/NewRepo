import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle2, CalendarDays, Users, Home, Bell } from "lucide-react";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [partnerEmail, setPartnerEmail] = useState("");
  
  // Variantes de animação
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.5,
        delay: i * 0.1,
        ease: "easeOut"
      }
    })
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
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
        delay: 0.1
      } 
    }
  };

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/onboarding/complete", {
        partnerEmail: partnerEmail || undefined
      });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Tudo pronto!",
        description: "Você já pode começar a usar o Por Nós.",
      });
      setTimeout(() => {
        navigate("/");
      }, 800);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível concluir a configuração. Tente novamente.",
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
    <div className="h-full flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
      {/* Elementos decorativos de fundo */}
      <motion.div 
        className="absolute top-[10%] right-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      />
      
      <motion.div 
        className="absolute bottom-[10%] left-[-10%] w-96 h-96 rounded-full bg-primary/5 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          repeatType: "reverse",
          delay: 2
        }}
      />
      
      {/* Cabeçalho */}
      <div className="flex justify-between px-6 pt-5">
        <div className="flex space-x-2">
          <div className={`h-1.5 w-10 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}></div>
          <div className={`h-1.5 w-10 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
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
                className="bg-primary/10 inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
              >
                <Users className="text-primary h-10 w-10" />
              </motion.div>
              
              <motion.h2 
                variants={cardVariants}
                custom={0}
                className="text-2xl font-bold mb-3"
              >
                Bem-vindo(a) ao Por Nós!
              </motion.h2>
              
              <motion.div 
                variants={cardVariants}
                custom={1}
                className="text-muted-foreground mb-8 space-y-3"
              >
                <p>
                  Se você está se cadastrando, é porque decidiu dar um upgrade na vida <span className="text-primary">💫</span> — ao lado do amor da sua vida <span className="text-rose-500">❤️</span>!
                </p>
                <p>
                  É hora de construir uma nova rotina, criar hábitos incríveis e organizar o caos com leveza, parceria e muito amor.
                </p>
                <p>
                  Porque juntos, tudo flui melhor, fica mais divertido e tem muito mais sentido! <span className="text-primary">✨</span>
                </p>
              </motion.div>

              <motion.div className="grid gap-3 mb-8">
                <motion.div 
                  variants={cardVariants}
                  custom={2}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Calendário Compartilhado</h3>
                      <p className="text-xs text-muted-foreground">Visualize e organize eventos juntos</p>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  variants={cardVariants}
                  custom={3}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Tarefas Domésticas</h3>
                      <p className="text-xs text-muted-foreground">Divida e gerencie responsabilidades</p>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div 
                  variants={cardVariants}
                  custom={4}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Card className="p-4 border border-primary/20 flex items-center gap-3 overflow-hidden">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium">Notificações</h3>
                      <p className="text-xs text-muted-foreground">Receba lembretes importantes</p>
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
                  className="bg-primary/10 inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
                >
                  <Users className="text-primary h-10 w-10" />
                </motion.div>
                
                <motion.h2 
                  variants={cardVariants}
                  custom={0}
                  className="text-2xl font-bold mb-3"
                >
                  Convide seu parceiro(a)
                </motion.h2>
                
                <motion.div 
                  variants={cardVariants}
                  custom={1}
                  className="text-muted-foreground mb-8 space-y-3"
                >
                  <p>
                    Compartilhar seus planos e tarefas com seu parceiro vai além da organização!
                  </p>
                  <p>
                    Se você está recebendo um convite, é sinal de que alguém te ama muito <span className="text-rose-500">💌</span> e acredita que vocês merecem viver algo ainda mais especial juntos.
                  </p>
                  <p>
                    Alguém que quer dividir o melhor da vida com você — com mais conexão, equilíbrio e alegria! <span className="text-primary">🌈</span><span className="text-rose-500">💖</span>
                  </p>
                </motion.div>
              </div>

              <motion.div 
                variants={cardVariants}
                custom={2}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email do parceiro(a)
                  </label>
                  <motion.div
                    whileTap={{ scale: 0.99 }}
                  >
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition-shadow duration-300"
                      placeholder="Digite o email"
                    />
                  </motion.div>
                  <motion.p 
                    variants={cardVariants}
                    custom={3}
                    className="text-xs text-muted-foreground mt-2"
                  >
                    Seu parceiro receberá um convite para se juntar a você no app
                  </motion.p>
                </div>
              </motion.div>
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
                  transition: { duration: 0.2 }
                }}
                className="inline-block"
              >
                {step === 2 ? "Concluir" : "Continuar"}
              </motion.span>
              
              <motion.span
                initial={{ opacity: 0, y: 20, position: "absolute", left: "50%", translateX: "-50%" }}
                whileHover={{ 
                  y: 0, 
                  opacity: 1,
                  transition: { duration: 0.2 }
                }}
                className="inline-flex items-center gap-1"
              >
                {step === 2 ? (
                  <>Começar <CheckCircle2 className="w-4 h-4 ml-1" /></>
                ) : (
                  <>Próximo <motion.span 
                    initial={{ x: 0 }}
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1, repeatDelay: 1 }}
                  >→</motion.span></>
                )}
              </motion.span>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
