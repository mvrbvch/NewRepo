import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import JourneyTimeline from "./journey-timeline";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  ArrowRight, 
  Sparkles,
  Calendar,
  CheckCircle2,
  Home,
  UserPlus
} from "lucide-react";

// Etapas da tela de boas-vindas
enum WelcomeStep {
  WELCOME = "welcome",
  JOURNEY = "journey",
  FEATURES = "features",
  COMPLETE = "complete",
}

interface WelcomeScreenProps {
  onComplete: () => void;
}

// Adicionar tipo para parceiro se não existir no hook auth
interface Partner {
  name: string;
  createdAt?: string | Date;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<WelcomeStep>(WelcomeStep.WELCOME);
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  // Mocking partner para demo - será substituído por informações reais
  const [partner, setPartner] = useState<Partner | null>(null);

  // Obter informações do parceiro quando estiver disponível
  useEffect(() => {
    // Para fins de demonstração - aqui seria uma chamada à API
    // para obter os dados do parceiro
    if (user) {
      // Simulação - remover e substituir com dados reais
      const hasPartner = Math.random() > 0.5; // apenas para exemplo
      if (hasPartner) {
        setPartner({
          name: "Parceiro(a)",
          createdAt: new Date()
        });
      }
    }
  }, [user]);

  // Animações compartilhadas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
      },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95
    }
  };

  // Avançar para a próxima etapa
  const nextStep = () => {
    switch (step) {
      case WelcomeStep.WELCOME:
        setStep(WelcomeStep.JOURNEY);
        break;
      case WelcomeStep.JOURNEY:
        setStep(WelcomeStep.FEATURES);
        break;
      case WelcomeStep.FEATURES:
        setStep(WelcomeStep.COMPLETE);
        break;
      case WelcomeStep.COMPLETE:
        onComplete();
        break;
    }
  };

  // Pular completamente a tela de boas-vindas
  const skipWelcome = () => {
    onComplete();
  };

  // Animações específicas para o passo de recursos
  const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  // Renderizar etapa atual do onboarding
  const renderStep = () => {
    switch (step) {
      case WelcomeStep.WELCOME:
        return (
          <motion.div 
            key="welcome-step"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center text-center px-6"
          >
            <motion.div 
              className="mb-8 flex justify-center"
              variants={itemVariants}
            >
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Heart className="h-12 w-12 text-primary" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-bold mb-4"
              variants={itemVariants}
            >
              Bem-vindo(a) ao <span className="text-primary">Nós Juntos</span>!
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground text-lg mb-6 max-w-md"
              variants={itemVariants}
            >
              {partner ? 
                `Olá ${user?.name}, estamos muito felizes por você e ${partner.name} estarem aqui!` : 
                `Olá ${user?.name}, estamos muito felizes por você estar aqui!`}
            </motion.p>
            
            <motion.p 
              className="text-muted-foreground mb-8 max-w-md"
              variants={itemVariants}
            >
              Vamos conhecer um pouco mais sobre a sua jornada como casal e como podemos
              ajudar vocês a organizarem a vida juntos de forma mais harmoniosa e conectada.
            </motion.p>
            
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button onClick={nextStep} size="lg" className="group">
                Começar jornada
                <motion.span
                  className="ml-2 inline-block"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        );
      
      case WelcomeStep.JOURNEY:
        return (
          <JourneyTimeline onComplete={nextStep} />
        );
      
      case WelcomeStep.FEATURES:
        return (
          <motion.div 
            key="features-step"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center px-6"
          >
            <motion.h1 
              className="text-3xl font-bold mb-4 text-center"
              variants={itemVariants}
            >
              O que vocês podem fazer no <span className="text-primary">Nós Juntos</span>
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground text-center mb-10 max-w-md"
              variants={itemVariants}
            >
              Descubra como o aplicativo pode transformar a organização da vida a dois
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-10">
              {[
                {
                  icon: <Calendar className="h-8 w-8 text-primary" />,
                  title: "Calendário Compartilhado",
                  description: "Visualizem a agenda juntos com diferentes modos de visualização, incluindo timeline personalizada.",
                  delay: 0
                },
                {
                  icon: <Home className="h-8 w-8 text-primary" />,
                  title: "Tarefas Domésticas",
                  description: "Dividam as responsabilidades da casa de forma equilibrada e com lembretes personalizados.",
                  delay: 1
                },
                {
                  icon: <Sparkles className="h-8 w-8 text-primary" />,
                  title: "Momentos Especiais",
                  description: "Registrem e celebrem momentos importantes da relação com marcos personalizados.",
                  delay: 2
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  custom={feature.delay}
                  variants={featureCardVariants}
                  className="bg-white/80 p-6 rounded-lg border border-primary/10 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
            
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button onClick={nextStep} size="lg" className="group">
                Continuar
                <motion.span
                  className="ml-2 inline-block"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        );
      
      case WelcomeStep.COMPLETE:
        return (
          <motion.div 
            key="complete-step"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="flex flex-col items-center text-center px-6"
          >
            <motion.div 
              className="mb-8 flex justify-center"
              variants={itemVariants}
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl font-bold mb-4"
              variants={itemVariants}
            >
              Tudo pronto!
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground text-lg mb-6 max-w-md"
              variants={itemVariants}
            >
              {partner ? 
                `Agora vocês podem começar a organizar a vida juntos com mais conexão, harmonia e propósito!` : 
                `Agora você já pode começar a usar o aplicativo. O Nós Juntos fica ainda melhor com seu parceiro(a)!`}
            </motion.p>
            
            {!partner && (
              <motion.div
                variants={itemVariants}
                className="mb-8 bg-primary/5 p-6 rounded-xl border border-primary/10 max-w-md"
              >
                <h3 className="text-lg font-medium mb-3">Convide seu parceiro(a) para o Nós Juntos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Compartilhem o calendário, tarefas domésticas e organizem a vida juntos com mais facilidade!
                </p>
                <Link href="/invite-partner" className="inline-block">
                  <Button variant="outline" size="sm" className="text-primary border-primary/20">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar parceiro(a)
                  </Button>
                </Link>
              </motion.div>
            )}
            
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button onClick={onComplete} size="lg" variant="default" className="group">
                Começar a usar o app
                <motion.span
                  className="ml-2 inline-block"
                  initial={{ x: 0 }}
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 0.5 }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.span>
              </Button>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-white via-primary/5 to-white">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          className="absolute top-[5%] right-[-15%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
        
        <motion.div 
          className="absolute bottom-[5%] left-[-15%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2],
            x: [0, -20, 0],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 2
          }}
        />
        
        <motion.div 
          className="absolute top-[40%] right-[40%] w-[15rem] h-[15rem] rounded-full bg-rose-500/5 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.1, 0.2],
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
        />
      </div>

      {/* Header - com botão de pular */}
      <header className="w-full p-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={skipWelcome} className="text-muted-foreground">
          Pular
        </Button>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col justify-center items-center py-10">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>

      {/* Indicador de progresso */}
      {step !== WelcomeStep.JOURNEY && (
        <footer className="w-full p-6 flex justify-center">
          <div className="flex space-x-2">
            {Object.values(WelcomeStep).map((s, index) => (
              <div 
                key={s}
                className={`h-2 w-10 rounded-full transition-colors duration-300 ${
                  Object.values(WelcomeStep).indexOf(step) >= index 
                    ? "bg-primary" 
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};

export default WelcomeScreen;