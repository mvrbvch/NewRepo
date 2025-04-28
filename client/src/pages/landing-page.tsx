import * as React from "react";
import { useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useMedia } from "react-use";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarDays,
  Heart,
  Home,
  MessageSquare,
  BellRing,
  Users,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Calendar,
  ListTodo,
  Clock,
  Smile,
  UserPlus,
  Bell,
  CheckCircle,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { gsap } from "gsap";

// Importando as imagens
import logoPath from "@assets/logo.png";
import iconPath from "@assets/icon.png";

const LandingPage: React.FC = () => {
  const isMobile = useMedia("(max-width: 768px)");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const featureCardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
    hover: {
      y: -10,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const testimonials = [
    {
      name: "Maria e João",
      comment:
        "Desde que começamos a usar o Nós Juntos, nossas discussões sobre tarefas domésticas acabaram! A organização do calendário compartilhado também melhorou muito nossa comunicação.",
      role: "Juntos há 3 anos",
    },
    {
      name: "Carla e Pedro",
      comment:
        "As notificações e lembretes são ótimos! Não esquecemos mais compromissos importantes e conseguimos planejar nosso tempo juntos com mais qualidade.",
      role: "Casados há 5 anos",
    },
    {
      name: "Juliana e Marcos",
      comment:
        "A divisão de tarefas ficou muito mais justa e clara. A visualização de timeline nos ajuda a ter uma visão completa da nossa semana.",
      role: "Noivos",
    },
  ];

  // Referências para animação com GSAP
  const appScreensRef = useRef<HTMLDivElement>(null);
  const calendarScreenRef = useRef<HTMLDivElement>(null);
  const tasksScreenRef = useRef<HTMLDivElement>(null);
  const notificationsScreenRef = useRef<HTMLDivElement>(null);

  // Animação com GSAP para as telas do aplicativo
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animação das telas do aplicativo quando entram na visualização
            if (appScreensRef.current) {
              gsap.fromTo(
                calendarScreenRef.current,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.2 }
              );
              
              gsap.fromTo(
                tasksScreenRef.current,
                { y: 70, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.5 }
              );
              
              gsap.fromTo(
                notificationsScreenRef.current,
                { y: 90, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.8 }
              );

              // Animação dos dados dentro das telas
              gsap.to(".calendar-event", {
                backgroundColor: "rgba(241, 90, 89, 0.15)",
                stagger: 0.1,
                duration: 0.4,
                delay: 1,
                repeat: 1,
                yoyo: true
              });

              gsap.to(".task-item-check", {
                scale: 1.2,
                stagger: 0.15,
                duration: 0.3,
                delay: 1.2,
                repeat: 1,
                yoyo: true
              });

              gsap.to(".notification-dot", {
                scale: 1.5,
                stagger: 0.1,
                duration: 0.4,
                delay: 1.5,
                repeat: 1,
                yoyo: true
              });
            }
            
            // Desconectar o observer após acionar a animação
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 } // Aciona quando 30% do elemento está visível
    );

    if (appScreensRef.current) {
      observer.observe(appScreensRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-white">
      {/* Elementos decorativos de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[-5%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[10%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-[40%] right-[30%] w-[15rem] h-[15rem] rounded-full bg-rose-500/5 blur-3xl" />
      </div>

      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-6">
          <div className="flex items-center gap-2">
            <img src={logoPath} alt="Nós Juntos" className="h-10 w-auto" />
            <span className="font-bold text-xl text-primary"></span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#benefits"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Benefícios
            </a>
            {/* <a href="#testimonials" className="text-muted-foreground hover:text-primary transition-colors">
              Depoimentos
            </a> */}
            <a
              href="#welcome-preview"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Experiência
            </a>
          </nav>
          <div>
            <Link href="/auth">
              <Button variant="default" size="sm">
                Entrar
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="space-y-6 text-center lg:text-left"
            >
              <div className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm">
                Organização para casais
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Vivam a vida a dois com mais{" "}
                <span className="text-primary">conexão</span> e{" "}
                <span className="text-rose-500">harmonia</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px] mx-auto lg:mx-0">
                Calendário compartilhado, divisão de tarefas, notificações e
                muito mais para fortalecer sua relação e organizar a rotina
                juntos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth?redirect=welcome">
                  <Button size="lg" className="group w-full sm:w-auto">
                    Começar agora
                    <motion.span
                      className="ml-2"
                      initial={{ x: 0 }}
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        repeatDelay: 0.5,
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.span>
                  </Button>
                </Link>
                <a href="#features">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Conhecer mais
                  </Button>
                </a>
              </div>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="relative flex justify-center"
            >
              <div className="relative w-full max-w-[400px] aspect-square mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl transform -translate-x-4 translate-y-4" />
                <img
                  src={iconPath}
                  alt="Nós Juntos App"
                  className="relative z-10 w-full h-full object-contain drop-shadow-xl"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/70">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tudo o que vocês precisam para organizar a rotina, conectar suas
              agendas e viver uma vida a dois mais equilibrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
            {[
              {
                icon: <Calendar className="h-10 w-10 text-primary" />,
                title: "Calendário Compartilhado",
                description:
                  "Visualizem eventos juntos com múltiplas visualizações: mês, semana, dia e timeline personalizada.",
                delay: 0,
              },
              {
                icon: <ListTodo className="h-10 w-10 text-primary" />,
                title: "Tarefas Domésticas",
                description:
                  "Dividam as responsabilidades da casa, com sistema de rotatividade e lembretes personalizados.",
                delay: 1,
              },
              {
                icon: <BellRing className="h-10 w-10 text-primary" />,
                title: "Notificações Inteligentes",
                description:
                  "Recebam lembretes de compromissos e tarefas importantes no momento certo.",
                delay: 2,
              },
              {
                icon: <Clock className="h-10 w-10 text-primary" />,
                title: "Timeline Personalizada",
                description:
                  "Visualizem compromissos em timeline para melhor organização do tempo juntos.",
                delay: 3,
              },
              {
                icon: <UserPlus className="h-10 w-10 text-primary" />,
                title: "Sistema de Convites",
                description:
                  "Convidem o parceiro(a) facilmente por email com onboarding personalizado.",
                delay: 4,
              },
              {
                icon: <MessageSquare className="h-10 w-10 text-primary" />,
                title: "Notas Compartilhadas",
                description:
                  "Compartilhem ideias, listas de compras e planos futuros em tempo real.",
                delay: 5,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                custom={feature.delay}
                variants={featureCardVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                whileHover="hover"
              >
                <Card className="border border-primary/10 h-full">
                  <CardHeader>
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Benefícios para a Relação
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Mais do que um app de organização, o Nós Juntos fortalece a
              parceria e o relacionamento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mx-auto">
            <div className="order-2 md:order-1">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {[
                  {
                    title: "Mais Tempo de Qualidade",
                    description:
                      "Com uma organização mais eficiente, vocês terão mais tempo para aproveitar juntos.",
                  },
                  {
                    title: "Menos Conflitos por Tarefas",
                    description:
                      "Divisão clara de responsabilidades reduz desentendimentos no dia a dia.",
                  },
                  {
                    title: "Maior Comunicação",
                    description:
                      "O app incentiva o diálogo e a cooperação para planejar a rotina.",
                  },
                  {
                    title: "Equilíbrio e Parceria",
                    description:
                      "Construam uma rotina mais justa e equilibrada, fortalecendo a parceria.",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="bg-primary/10 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
            <motion.div
              className="order-1 md:order-2 flex justify-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-rose-500/20 rounded-full blur-3xl transform scale-90" />
                <div className="relative z-10 bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-primary/10">
                  <div className="flex flex-col items-center text-center space-y-6 max-w-md">
                    <Heart className="h-16 w-16 text-rose-500" />
                    <h3 className="text-2xl font-bold">
                      Porque juntos, tudo flui melhor!
                    </h3>
                    <p className="text-muted-foreground">
                      O Nós Juntos nasceu da ideia de que relacionamentos
                      saudáveis são baseados em comunicação, equilíbrio e
                      organização. Nossa missão é simplificar a vida a dois,
                      deixando mais espaço para o que realmente importa: o amor
                      entre vocês.
                    </p>
                    <Link href="/auth?redirect=welcome">
                      <Button className="mt-4">Experimentar Agora</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-20 bg-white/70">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O Que Dizem Nossos Usuários</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Casais que já estão transformando seus relacionamentos com o Nós Juntos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-primary/10">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-4">
                      {Array(5).fill(0).map((_, i) => (
                        <Smile key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="italic">"{testimonial.comment}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section> */}
      
      {/* App Screens Section com GSAP */}
      <section id="app-screens" className="py-20 bg-white/70 overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Conheça a Experiência
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como o aplicativo pode transformar o dia a dia de vocês com uma interface intuitiva e funcionalidades práticas.
            </p>
          </div>

          {/* Telas do aplicativo com GSAP animations */}
          <div 
            ref={appScreensRef} 
            className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {/* Tela do Calendário */}
            <div 
              ref={calendarScreenRef}
              className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden"
            >
              {/* Header aplicativo */}
              <div className="bg-primary p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="text-white">
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19.5C11.658 19.5 11.316 19.458 10.974 19.374C7.764 18.576 1.5 14.328 1.5 8.4C1.5 5.736 3.576 3.51 6.222 3.51C8.376 3.51 9.942 4.86 10.902 6.06C11.19 6.426 11.442 6.81 11.658 7.194C11.766 7.374 11.874 7.554 11.982 7.734H12.018C12.126 7.554 12.234 7.374 12.342 7.194C12.558 6.81 12.81 6.426 13.098 6.06C14.058 4.86 15.624 3.51 17.778 3.51C20.424 3.51 22.5 5.736 22.5 8.4C22.5 14.328 16.236 18.576 13.026 19.374C12.684 19.458 12.342 19.5 12 19.5Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-white font-semibold text-sm">NÓS JUNTOS</div>
                </div>
                <div className="flex items-center">
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary-600 text-white text-xs">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16.5V12.9C12 12.4029 12 12.1544 11.8978 11.977C11.8074 11.8178 11.6822 11.6926 11.523 11.6022C11.3456 11.5 11.0971 11.5 10.6 11.5H10.1C9.60294 11.5 9.35442 11.5 9.17702 11.6022C9.01785 11.6926 8.8926 11.8178 8.80225 11.977C8.7 12.1544 8.7 12.4029 8.7 12.9V16.5M15.3 16.5V14.7C15.3 14.2029 15.3 13.9544 15.1978 13.777C15.1074 13.6178 14.9822 13.4926 14.823 13.4022C14.6456 13.3 14.3971 13.3 13.9 13.3H13.4C12.9029 13.3 12.6544 13.3 12.477 13.4022C12.3178 13.4926 12.1926 13.6178 12.1022 13.777C12 13.9544 12 14.2029 12 14.7V16.5M5 2.25H19C19.5967 2.25 20.169 2.48705 20.591 2.90901C21.0129 3.33097 21.25 3.90326 21.25 4.5V17.25C21.25 17.8467 21.0129 18.419 20.591 18.841C20.169 19.2629 19.5967 19.5 19 19.5H5C4.40326 19.5 3.83097 19.2629 3.40901 18.841C2.98705 18.419 2.75 17.8467 2.75 17.25V4.5C2.75 3.90326 2.98705 3.33097 3.40901 2.90901C3.83097 2.48705 4.40326 2.25 5 2.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Instalar no iOS
                  </button>
                  <div className="text-white ml-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-white ml-2">MM</div>
                </div>
              </div>
              
              {/* Header mês atual */}
              <div className="bg-primary/10 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">Mês atual (abril 2025)</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <span>7 eventos</span> • 
                      <span className="flex items-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        7 compartilhados
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded text-blue-600 bg-blue-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="6" width="18" height="15" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
                        <path d="M3 10H21" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7 3L7 7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M17 3L17 7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Navegação de visualização */}
                <div className="flex mt-2 border-b">
                  <button className="px-3 py-1.5 text-sm">Dia</button>
                  <button className="px-3 py-1.5 text-sm">Semana</button>
                  <button className="px-3 py-1.5 text-sm bg-primary text-white rounded-t-md">Mês</button>
                  <button className="px-3 py-1.5 text-sm flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10H21" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 14H21" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 18H21" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 6H21" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Timeline
                  </button>
                  <div className="flex-grow"></div>
                  <button className="px-3 py-1.5 text-sm text-primary">Hoje</button>
                </div>
              </div>
              
              <div className="p-3">
                {/* Navegação do mês */}
                <div className="flex justify-between items-center mb-2">
                  <button className="w-6 h-6 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 18L9 12L15 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="font-medium">abril 2025</div>
                  <button className="w-6 h-6 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                
                {/* Calendário */}
                <div className="calendar-event">
                  <div className="grid grid-cols-7 gap-1">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center text-xs text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    
                    {/* Dias do mês - corresponde à captura de tela */}
                    <div className="text-center text-xs py-2 text-gray-400">30</div>
                    <div className="text-center text-xs py-2 text-gray-400">31</div>
                    <div className="text-center text-xs py-2">1</div>
                    <div className="text-center text-xs py-2">2</div>
                    <div className="text-center text-xs py-2">3</div>
                    <div className="text-center text-xs py-2">4</div>
                    <div className="text-center text-xs py-2">5</div>
                    
                    <div className="text-center text-xs py-2">6</div>
                    <div className="text-center text-xs py-2">7</div>
                    <div className="text-center text-xs py-2">8</div>
                    <div className="text-center text-xs py-2">9</div>
                    <div className="text-center text-xs py-2">10</div>
                    <div className="text-center text-xs py-2">11</div>
                    <div className="text-center text-xs py-2">12</div>
                    
                    <div className="text-center text-xs py-2">13</div>
                    <div className="text-center text-xs py-2">14</div>
                    <div className="text-center text-xs py-2">15</div>
                    <div className="text-center text-xs py-2">16</div>
                    <div className="text-center text-xs py-2">17</div>
                    <div className="text-center text-xs py-2">18</div>
                    <div className="text-center text-xs py-2">19</div>
                    
                    <div className="text-center text-xs py-2">20</div>
                    <div className="text-center text-xs py-2">21</div>
                    <div className="text-center text-xs py-2">22</div>
                    <div className="text-center text-xs py-2">23</div>
                    <div className="text-center text-xs py-2">24</div>
                    <div className="text-center text-xs py-2">25</div>
                    <div className="text-center text-xs py-2">26</div>
                    
                    <div className="text-center text-xs py-2 relative">
                      27
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">T</div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-300"></div>
                    </div>
                    <div className="text-center text-xs py-2 font-bold bg-primary/10 rounded-sm">28</div>
                    <div className="text-center text-xs py-2">29</div>
                    <div className="text-center text-xs py-2">30</div>
                    <div className="text-center text-xs py-2 text-gray-400">1</div>
                    <div className="text-center text-xs py-2 text-gray-400">2</div>
                    <div className="text-center text-xs py-2 text-gray-400">3</div>
                  </div>
                </div>
              </div>
              
              {/* Bottom navigation */}
              <div className="mt-auto border-t py-2 px-6 flex justify-between">
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="15" rx="2" stroke="#E74C3C" strokeWidth="1.5"/>
                    <path d="M3 10H21" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 3L7 7" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M17 3L17 7" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] text-primary">Agenda</span>
                </button>
                <div className="relative -mt-8">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M7 12H17M10 18H14" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] text-gray-600">Tarefas</span>
                </button>
              </div>
            </div>
            
            {/* Tela de Tarefas */}
            <div 
              ref={tasksScreenRef}
              className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden"
            >
              {/* Header aplicativo */}
              <div className="bg-primary p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="text-white">
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19.5C11.658 19.5 11.316 19.458 10.974 19.374C7.764 18.576 1.5 14.328 1.5 8.4C1.5 5.736 3.576 3.51 6.222 3.51C8.376 3.51 9.942 4.86 10.902 6.06C11.19 6.426 11.442 6.81 11.658 7.194C11.766 7.374 11.874 7.554 11.982 7.734H12.018C12.126 7.554 12.234 7.374 12.342 7.194C12.558 6.81 12.81 6.426 13.098 6.06C14.058 4.86 15.624 3.51 17.778 3.51C20.424 3.51 22.5 5.736 22.5 8.4C22.5 14.328 16.236 18.576 13.026 19.374C12.684 19.458 12.342 19.5 12 19.5Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-white font-semibold text-sm">NÓS JUNTOS</div>
                </div>
                <div className="flex items-center">
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary-600 text-white text-xs">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16.5V12.9C12 12.4029 12 12.1544 11.8978 11.977C11.8074 11.8178 11.6822 11.6926 11.523 11.6022C11.3456 11.5 11.0971 11.5 10.6 11.5H10.1C9.60294 11.5 9.35442 11.5 9.17702 11.6022C9.01785 11.6926 8.8926 11.8178 8.80225 11.977C8.7 12.1544 8.7 12.4029 8.7 12.9V16.5M15.3 16.5V14.7C15.3 14.2029 15.3 13.9544 15.1978 13.777C15.1074 13.6178 14.9822 13.4926 14.823 13.4022C14.6456 13.3 14.3971 13.3 13.9 13.3H13.4C12.9029 13.3 12.6544 13.3 12.477 13.4022C12.3178 13.4926 12.1926 13.6178 12.1022 13.777C12 13.9544 12 14.2029 12 14.7V16.5M5 2.25H19C19.5967 2.25 20.169 2.48705 20.591 2.90901C21.0129 3.33097 21.25 3.90326 21.25 4.5V17.25C21.25 17.8467 21.0129 18.419 20.591 18.841C20.169 19.2629 19.5967 19.5 19 19.5H5C4.40326 19.5 3.83097 19.2629 3.40901 18.841C2.98705 18.419 2.75 17.8467 2.75 17.25V4.5C2.75 3.90326 2.98705 3.33097 3.40901 2.90901C3.83097 2.48705 4.40326 2.25 5 2.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Instalar no iOS
                  </button>
                  <div className="text-white ml-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-white ml-2">MM</div>
                </div>
              </div>
              
              {/* Header de tarefas */}
              <div className="bg-primary/10 p-3">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">Minhas tarefas</div>
                  <div className="flex gap-2">
                    <button className="px-2 py-1 bg-primary/10 text-xs rounded-md text-primary flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H21M7 12H17M11 18H13" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Filtros
                    </button>
                    <button className="px-2 py-1 bg-primary/10 text-xs rounded-md text-primary flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Nova
                    </button>
                  </div>
                </div>
                
                <div className="flex mt-3 border-b">
                  <button className="px-4 py-1.5 text-xs border-b-2 border-primary text-primary">Pendentes</button>
                  <button className="px-4 py-1.5 text-xs text-gray-500">Concluídas</button>
                  <button className="px-4 py-1.5 text-xs text-gray-500">Todas</button>
                </div>
              </div>
              
              <div className="p-3">
                {/* Grupo de tarefas */}
                <div className="task-item-check mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.9999 5.99997L19.7999 12L11.9999 18M4.19995 12H19.7999" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="font-medium text-sm">Tarefas Diárias</span>
                    </div>
                    <span className="bg-gray-200 px-1 rounded text-xs">3</span>
                  </div>
                </div>
                
                {/* Lista de tarefas */}
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-start">
                      <div className="task-item-check mt-1">
                        <div className="h-5 w-5 rounded border border-gray-300"></div>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">Tirar os lixos</div>
                        <div className="text-xs text-gray-500">Tarefa diária: Tirar os lixos</div>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-primary text-white text-[10px] rounded-full flex items-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="ml-1">Hoje</span>
                          </span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full flex items-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z" stroke="#3B82F6" strokeWidth="1.5"/>
                            </svg>
                            <span className="ml-1">Baixa</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <button className="text-gray-400">⋮</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-start">
                      <div className="task-item-check mt-1">
                        <div className="h-5 w-5 rounded border border-gray-300"></div>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">Lavar louça</div>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] rounded-full flex items-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z" stroke="#EF4444" strokeWidth="1.5"/>
                            </svg>
                            <span className="ml-1">Alta</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <button className="text-gray-400">⋮</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-start">
                      <div className="task-item-check mt-1">
                        <div className="h-5 w-5 rounded border border-gray-300"></div>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium">Limpar o robô aspirador</div>
                        <div className="text-xs text-gray-500">Tarefa diária: Limpar o robô aspirador</div>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full flex items-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.0489 3.92705C11.3483 3.00574 12.6517 3.00574 12.9511 3.92705L14.0206 7.21885C14.1545 7.63087 14.5385 7.90983 14.9717 7.90983H18.4329C19.4016 7.90983 19.8044 9.14945 19.0207 9.71885L16.2205 11.7533C15.87 12.0079 15.7234 12.4593 15.8572 12.8713L16.9268 16.1631C17.2261 17.0844 16.1717 17.8506 15.388 17.2812L12.5878 15.2467C12.2373 14.9921 11.7627 14.9921 11.4122 15.2467L8.61204 17.2812C7.82833 17.8506 6.77386 17.0844 7.0732 16.1631L8.14277 12.8713C8.27665 12.4593 8.12999 12.0079 7.7795 11.7533L4.97927 9.71885C4.19556 9.14945 4.59838 7.90983 5.56706 7.90983H9.0283C9.46148 7.90983 9.8455 7.63087 9.97937 7.21885L11.0489 3.92705Z" stroke="#3B82F6" strokeWidth="1.5"/>
                            </svg>
                            <span className="ml-1">Baixa</span>
                          </span>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <button className="text-gray-400">⋮</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom navigation */}
              <div className="mt-auto border-t py-2 px-6 flex justify-between">
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="15" rx="2" stroke="#666666" strokeWidth="1.5"/>
                    <path d="M3 10H21" stroke="#666666" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 3L7 7" stroke="#666666" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M17 3L17 7" stroke="#666666" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] text-gray-600">Agenda</span>
                </button>
                <div className="relative -mt-8">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M7 12H17M10 18H14" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] text-primary">Tarefas</span>
                </button>
              </div>
            </div>
            
            {/* Tela de Timeline */}
            <div 
              ref={notificationsScreenRef}
              className="bg-white rounded-xl shadow-lg border border-primary/10 overflow-hidden"
            >
              {/* Header aplicativo */}
              <div className="bg-primary p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="text-white">
                    <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 19.5C11.658 19.5 11.316 19.458 10.974 19.374C7.764 18.576 1.5 14.328 1.5 8.4C1.5 5.736 3.576 3.51 6.222 3.51C8.376 3.51 9.942 4.86 10.902 6.06C11.19 6.426 11.442 6.81 11.658 7.194C11.766 7.374 11.874 7.554 11.982 7.734H12.018C12.126 7.554 12.234 7.374 12.342 7.194C12.558 6.81 12.81 6.426 13.098 6.06C14.058 4.86 15.624 3.51 17.778 3.51C20.424 3.51 22.5 5.736 22.5 8.4C22.5 14.328 16.236 18.576 13.026 19.374C12.684 19.458 12.342 19.5 12 19.5Z" fill="white"/>
                    </svg>
                  </div>
                  <div className="text-white font-semibold text-sm">NÓS JUNTOS</div>
                </div>
                <div className="flex items-center">
                  <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary-600 text-white text-xs">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 16.5V12.9C12 12.4029 12 12.1544 11.8978 11.977C11.8074 11.8178 11.6822 11.6926 11.523 11.6022C11.3456 11.5 11.0971 11.5 10.6 11.5H10.1C9.60294 11.5 9.35442 11.5 9.17702 11.6022C9.01785 11.6926 8.8926 11.8178 8.80225 11.977C8.7 12.1544 8.7 12.4029 8.7 12.9V16.5M15.3 16.5V14.7C15.3 14.2029 15.3 13.9544 15.1978 13.777C15.1074 13.6178 14.9822 13.4926 14.823 13.4022C14.6456 13.3 14.3971 13.3 13.9 13.3H13.4C12.9029 13.3 12.6544 13.3 12.477 13.4022C12.3178 13.4926 12.1926 13.6178 12.1022 13.777C12 13.9544 12 14.2029 12 14.7V16.5M5 2.25H19C19.5967 2.25 20.169 2.48705 20.591 2.90901C21.0129 3.33097 21.25 3.90326 21.25 4.5V17.25C21.25 17.8467 21.0129 18.419 20.591 18.841C20.169 19.2629 19.5967 19.5 19 19.5H5C4.40326 19.5 3.83097 19.2629 3.40901 18.841C2.98705 18.419 2.75 17.8467 2.75 17.25V4.5C2.75 3.90326 2.98705 3.33097 3.40901 2.90901C3.83097 2.48705 4.40326 2.25 5 2.25Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Instalar no iOS
                  </button>
                  <div className="text-white ml-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-white ml-2">MM</div>
                </div>
              </div>
              
              {/* Header da página */}
              <div className="bg-primary/10 p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">26 de abril 2025</div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <span>2 eventos</span> • 
                      <span className="flex items-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        2 compartilhados
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center rounded text-blue-600 bg-blue-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="6" width="18" height="15" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
                        <path d="M3 10H21" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M7 3L7 7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M17 3L17 7" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="w-6 h-6 flex items-center justify-center rounded text-gray-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 18L15 12L9 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Navegação de visualização */}
                <div className="flex mt-2 border-b">
                  <button className="px-3 py-1.5 text-sm">Dia</button>
                  <button className="px-3 py-1.5 text-sm">Semana</button>
                  <button className="px-3 py-1.5 text-sm">Mês</button>
                  <button className="px-3 py-1.5 text-sm bg-primary text-white rounded-t-md flex items-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 10H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 14H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 18H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 6H21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Timeline
                  </button>
                  <div className="flex-grow"></div>
                  <button className="px-3 py-1.5 text-sm text-primary">Hoje</button>
                </div>
              </div>
              
              <div className="p-3">
                {/* Seção Manhã */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center mr-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2V4M12 20V22M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Manhã</div>
                    <div className="text-xs text-gray-500 ml-2">6h - 12h</div>
                  </div>
                  
                  {/* Evento 1 */}
                  <div className="ml-8 pl-4 border-l-2 border-orange-300 relative notification-dot">
                    <div className="absolute -left-[0.3rem] top-1 h-2 w-2 rounded-full bg-orange-300"></div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">9:00</div>
                      <div className="text-sm">10:00</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg mb-3">
                      <div className="flex items-center">
                        <div className="mr-2">
                          <span className="text-lg">🎭</span>
                        </div>
                        <div>
                          <div className="font-medium">Compartilhado</div>
                          <div className="text-xs text-gray-500">Compartilhado</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Evento 2 */}
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">9:00</div>
                      <div className="text-sm">11:00</div>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <div className="flex flex-col">
                        <div className="font-medium">Ir ao bazar Ludi e Rosa dos Ventos</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <svg className="inline-block mr-1" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Na rua
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Compartilhado</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Seção Tarde */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12L17 7M17 12V7H12M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Tarde</div>
                    <div className="text-xs text-gray-500 ml-2">12h - 18h</div>
                  </div>
                  
                  <div className="ml-8 pl-4 border-l-2 border-blue-300 py-4">
                    <div className="text-xs text-gray-500 italic text-center">
                      Nenhum evento neste período
                    </div>
                  </div>
                </div>
                
                {/* Seção Noite */}
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.75 4.46023C15.75 2.48431 17.8429 1.31717 19.5243 2.29085L20.1662 1.075C17.7132 -0.358983 14.25 1.41855 14.25 4.46023H15.75ZM21.7092 4.47572C22.6828 6.15708 21.5157 8.25 19.5398 8.25V9.75C22.5814 9.75 24.359 6.28676 23.275 3.83375L21.7092 4.47572ZM19.5243 2.29085C20.5295 2.90211 21.098 3.97055 20.7557 5.0491C20.4134 6.12765 19.3397 6.75 18.2215 6.75V8.25C20.2603 8.25 22.2866 6.94975 22.9371 4.71315C23.5877 2.47655 22.5685 0.125092 20.1662 1.075L19.5243 2.29085ZM12 2.75C13.7117 2.75 15.3219 3.22447 16.6881 4.08269L17.4319 2.76217C15.8261 1.75652 13.9567 1.25 12 1.25V2.75ZM14.25 4.46023C14.25 5.54843 13.6277 6.62188 12.5491 6.9643C11.4706 7.30672 10.4021 6.73825 9.79085 5.73315L8.57501 6.37505C9.52041 7.97365 11.3415 9.25 13.4425 9.25C16.4039 9.25 17.75 6.58139 17.75 4.46023H14.25ZM23.275 3.83375L21.7092 4.47572L20.4253 11.469L18.8596 12.112L20.4253 11.469L21.0672 11.8568C22.151 13.4853 21.8174 15.5092 20.4449 16.8816L21.5056 17.9424C23.397 16.051 23.9939 13.1547 22.4168 10.8449L23.275 3.83375ZM12.5312 3.57467L12.1432 2.93276L11.7553 2.29085L12.5312 3.57467ZM9.79085 5.73315C9.17959 4.72805 9.63542 3.35675 10.6557 2.82196L9.93685 1.43157C8.07499 2.39974 7.11516 4.7765 8.57501 6.37505L9.79085 5.73315ZM12.1432 2.93276C11.6255 2.10207 10.5771 1.76497 9.93685 1.43157L12.1432 2.93276Z" fill="#8B5CF6"/>
                      </svg>
                    </div>
                    <div className="text-sm font-medium">Noite</div>
                    <div className="text-xs text-gray-500 ml-2">18h - 00h</div>
                  </div>
                  
                  <div className="ml-8 pl-4 border-l-2 border-purple-300 py-4">
                    <div className="text-xs text-gray-500 italic text-center">
                      Nenhum evento neste período
                    </div>
                  </div>
                </div>
                
                {/* Opção de biometria */}
                <div className="text-center mt-4 text-gray-500 text-xs">
                  <button className="flex items-center justify-center mx-auto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22V12M12 8V2M4 12H2M6.31412 6.31412L4.8999 4.8999M17.6859 6.31412L19.1001 4.8999M6.31412 17.69L4.8999 19.1042M17.6859 17.69L19.1001 19.1042M22 12H20" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="ml-1">Registrar Biometria</span>
                  </button>
                </div>
              </div>
              
              {/* Bottom navigation */}
              <div className="mt-auto border-t py-2 px-6 flex justify-between">
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="6" width="18" height="15" rx="2" stroke="#E74C3C" strokeWidth="1.5"/>
                    <path d="M3 10H21" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 3L7 7" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M17 3L17 7" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[10px] text-primary">Agenda</span>
                </button>
                <div className="relative -mt-8">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <button className="flex flex-col items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6H21M7 12H17M10 18H14" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] text-gray-600">Tarefas</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/auth?redirect=welcome">
              <Button size="lg">
                Comece sua organização agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome Experience Preview Section */}
      <section id="welcome-preview" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />

        <div className="container px-4 md:px-6 relative z-10 mx-auto max-w-6xl">
          <motion.div
            className="max-w-4xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nossa Nova Experiência de Boas-Vindas
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Conhecendo a jornada e o significado por trás do Nós Juntos
            </p>
          </motion.div>

          {/* Demonstração visual da experiência de onboarding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-8 max-w-6xl mx-auto">
            {/* Card 1: Tela de boas-vindas */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/10">
              {/* Header da tela */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src={logoPath} alt="Nós Juntos" className="h-6" />
                  <span className="font-semibold text-sm">Nós Juntos</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Pular
                </Button>
              </div>

              {/* Conteúdo da primeira tela */}
              <motion.div
                className="flex flex-col items-center text-center p-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="mb-6 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-primary" />
                </div>

                <h3 className="text-xl font-bold mb-3">
                  Bem-vindo(a) ao{" "}
                  <span className="text-primary">Nós Juntos</span>!
                </h3>

                <p className="text-muted-foreground text-sm mb-4 max-w-xs">
                  Olá Usuário, estamos muito felizes por você estar aqui!
                </p>

                <p className="text-muted-foreground text-xs mb-6 max-w-xs">
                  Vamos conhecer um pouco mais sobre a sua jornada como casal e
                  como podemos ajudar vocês a organizarem a vida juntos.
                </p>

                <Button size="sm" className="group">
                  Começar jornada
                  <motion.span
                    className="ml-2 inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      repeatDelay: 0.5,
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </motion.span>
                </Button>
              </motion.div>

              {/* Indicador de progresso */}
              <div className="w-full p-3 flex justify-center border-t border-primary/5">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                </div>
              </div>
            </div>

            {/* Card 2: Tela da jornada */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/10">
              {/* Header da tela */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src={logoPath} alt="Nós Juntos" className="h-6" />
                  <span className="font-semibold text-sm">Nós Juntos</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Pular
                </Button>
              </div>

              {/* Conteúdo da tela da jornada */}
              <motion.div
                className="flex flex-col items-center text-center p-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold mb-2">Sua Jornada Juntos</h3>

                <p className="text-muted-foreground text-xs mb-4 max-w-xs">
                  Relembre os momentos especiais que construíram sua história de
                  amor
                </p>

                {/* Timeline simplificada */}
                <div className="relative w-full py-3">
                  {/* Linha central */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary/20 rounded-full"></div>

                  {/* Evento 1 */}
                  <div className="relative mb-4 flex">
                    <div className="w-1/2 pr-4 text-right">
                      <div className="p-2 bg-white/80 rounded-lg border border-primary/10 shadow-sm">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">
                            15 de Maio de 2023
                          </span>
                          <div className="bg-primary/10 p-1 rounded-full">
                            <Heart className="h-4 w-4 text-rose-500" />
                          </div>
                        </div>
                        <h4 className="text-sm font-medium">
                          Início do relacionamento
                        </h4>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/4">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    <div className="w-1/2"></div>
                  </div>

                  {/* Evento 2 */}
                  <div className="relative mb-4 flex">
                    <div className="w-1/2"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/4">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    </div>
                    <div className="w-1/2 pl-4">
                      <div className="p-2 bg-white/80 rounded-lg border border-primary/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="bg-primary/10 p-1 rounded-full">
                            <Calendar className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            22 de Maio de 2023
                          </span>
                        </div>
                        <h4 className="text-sm font-medium">
                          Primeiro encontro
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                <Button size="sm" className="mt-3 group">
                  Continuar
                  <motion.span
                    className="ml-2 inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      repeatDelay: 0.5,
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </motion.span>
                </Button>
              </motion.div>

              {/* Indicador de progresso */}
              <div className="w-full p-3 flex justify-center border-t border-primary/5">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                </div>
              </div>
            </div>

            {/* Card 3: Funcionalidades */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/10">
              {/* Header da tela */}
              <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src={logoPath} alt="Nós Juntos" className="h-6" />
                  <span className="font-semibold text-sm">Nós Juntos</span>
                </div>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Pular
                </Button>
              </div>

              {/* Conteúdo da tela de funcionalidades */}
              <motion.div
                className="flex flex-col items-center text-center p-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold mb-2">
                  Escolha as Funcionalidades
                </h3>

                <p className="text-muted-foreground text-xs mb-4 max-w-xs">
                  Personalize sua experiência selecionando o que mais importa
                  para vocês
                </p>

                {/* Lista de funcionalidades */}
                <div className="w-full space-y-3 mb-4">
                  <div className="flex items-center p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-3">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium">
                        Calendário Compartilhado
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Organize eventos e compromissos juntos
                      </p>
                    </div>
                    <div className="bg-primary/80 text-white p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex items-center p-2 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-3">
                      <ListTodo className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium">
                        Tarefas Domésticas
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Divida responsabilidades com equilíbrio
                      </p>
                    </div>
                    <div className="bg-primary/80 text-white p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="flex items-center p-2 rounded-lg border border-border bg-background">
                    <div className="bg-gray-100 p-1.5 rounded-full mr-3">
                      <BellRing className="h-4 w-4 text-gray-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-medium">
                        Lembretes Personalizados
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Notificações para momentos importantes
                      </p>
                    </div>
                    <div className="bg-gray-200 p-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <Button size="sm" className="mt-2 group">
                  Concluir
                  <motion.span
                    className="ml-2 inline-block"
                    animate={{ x: [0, 3, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      repeatDelay: 0.5,
                    }}
                  >
                    <ArrowRight className="h-3 w-3" />
                  </motion.span>
                </Button>
              </motion.div>

              {/* Indicador de progresso */}
              <div className="w-full p-3 flex justify-center border-t border-primary/5">
                <div className="flex space-x-1">
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-primary"></div>
                  <div className="h-1.5 w-8 rounded-full bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            className="mt-16 max-w-3xl mx-auto text-center space-y-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold">
              Pronto para organizar a vida a dois?
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece agora mesmo e transforme a maneira como vocês gerenciam a
              rotina e fortalecem a parceria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth?redirect=welcome">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar Gratuitamente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoPath} alt="Nós Juntos" className="h-8 w-auto" />
                <span className="font-bold text-xl">Nós Juntos</span>
              </div>
              <p className="text-muted-foreground">
                Organizando a vida a dois com mais leveza, conexão e amor.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a
                    href="#benefits"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Benefícios
                  </a>
                </li>

                <li>
                  <Link
                    href="/auth?redirect=welcome"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <p className="text-muted-foreground mb-2">
                Tem dúvidas ou sugestões?
              </p>
              <a
                href="mailto:contato@nosjuntos.app"
                className="text-primary hover:underline"
              >
                contato@nosjuntos.app
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Nós Juntos. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
