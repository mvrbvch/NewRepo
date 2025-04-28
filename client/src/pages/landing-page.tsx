import * as React from "react";
import { useRef } from "react";
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
} from "lucide-react";

// Importando componente de telas do app
import AppScreensMock from "@/components/app-screens/app-screens-mock";

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

  // Não precisamos mais de referências ou hooks GSAP aqui, pois foram movidos para o componente AppScreensMock

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
              href="#o-app"
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
      <section id="o-app" className="py-20 bg-white/70 overflow-hidden">
        <div className="container px-4 md:px-6 mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Conheça a Experiência
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como o aplicativo pode transformar o dia a dia de vocês com
              uma interface intuitiva e funcionalidades práticas.
            </p>
          </div>

          {/* Telas do aplicativo usando o componente AppScreensMock */}
          <AppScreensMock />
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
      <footer className="border-t border-border py-8 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoPath} alt="Nós Juntos" className="h-8 w-auto" />
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
                href="mailto:matheus@murbach.work"
                className="text-primary hover:underline"
              >
                Vem cá, fala com a gente!
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
