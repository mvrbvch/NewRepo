import * as React from "react";
import { Link } from "wouter";

// Versão estática e simplificada da landing page
const SimpleLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-white">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Nós Juntos" className="h-8 w-auto" />
            <span className="font-bold text-xl text-primary">Nós Juntos</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
              Funcionalidades
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-primary transition-colors">
              Benefícios
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-primary transition-colors">
              Demonstração
            </a>
          </nav>
          <div>
            <Link href="/auth">
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                Entrar
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-primary/10 px-4 py-2 rounded-full text-primary font-medium text-sm">
                Organização para casais
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Vivam a vida a dois com mais <span className="text-primary">conexão</span> e <span className="text-rose-500">harmonia</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px]">
                Calendário compartilhado, divisão de tarefas, notificações e muito mais para fortalecer sua relação e organizar a rotina juntos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <button className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
                    Começar agora
                  </button>
                </Link>
                <a href="#features">
                  <button className="bg-transparent border border-primary text-primary px-6 py-3 rounded-md hover:bg-primary/5 transition-colors font-medium">
                    Conhecer mais
                  </button>
                </a>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-[400px] aspect-square">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl transform -translate-x-4 translate-y-4" />
                <img
                  src="/icon.png"
                  alt="Nós Juntos App"
                  className="relative z-10 w-full h-full object-contain drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white/70">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades Principais</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Tudo o que vocês precisam para organizar a rotina, conectar suas agendas e viver uma vida a dois mais equilibrada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Calendário Compartilhado */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Calendário Compartilhado</h3>
              <p className="text-muted-foreground">Visualizem eventos juntos com múltiplas visualizações: mês, semana, dia e timeline personalizada.</p>
            </div>
            
            {/* Tarefas Domésticas */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tarefas Domésticas</h3>
              <p className="text-muted-foreground">Dividam as responsabilidades da casa, com sistema de rotatividade e lembretes personalizados.</p>
            </div>
            
            {/* Notificações */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-primary/10">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Notificações Inteligentes</h3>
              <p className="text-muted-foreground">Recebam lembretes de compromissos e tarefas importantes no momento certo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section (Incorporando a Welcome Page) */}
      <section id="demo" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
        
        <div className="container px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Veja a Experiência de Boas-vindas</h2>
            <p className="text-xl text-muted-foreground">
              Conhecendo a jornada e o significado por trás do Nós Juntos
            </p>
          </div>
          
          {/* Demonstração Simplificada */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary/10 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Nós Juntos" className="h-8" />
                <span className="font-semibold">Nós Juntos</span>
              </div>
              <button className="text-sm bg-transparent hover:bg-white/10 px-3 py-1 rounded-md">Pular</button>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 md:p-12">
              <div className="mb-8 bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              
              <h3 className="text-3xl font-bold mb-4">
                Bem-vindo(a) ao <span className="text-primary">Nós Juntos</span>!
              </h3>
              
              <p className="text-muted-foreground text-lg mb-6 max-w-md">
                Olá, estamos muito felizes por você estar aqui!
              </p>
              
              <p className="text-muted-foreground mb-8 max-w-md">
                Vamos conhecer um pouco mais sobre a sua jornada como casal e como podemos
                ajudar vocês a organizarem a vida juntos de forma mais harmoniosa e conectada.
              </p>
              
              <button className="bg-primary text-white px-6 py-3 rounded-md font-medium flex items-center">
                Começar jornada
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            
            <div className="w-full p-6 flex justify-center border-t border-primary/5">
              <div className="flex space-x-2">
                <div className="h-2 w-10 rounded-full bg-primary"></div>
                <div className="h-2 w-10 rounded-full bg-gray-200"></div>
                <div className="h-2 w-10 rounded-full bg-gray-200"></div>
                <div className="h-2 w-10 rounded-full bg-gray-200"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-16 max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">Pronto para organizar a vida a dois?</h2>
            <p className="text-xl text-muted-foreground">
              Comece agora mesmo e transforme a maneira como vocês gerenciam a rotina e fortalecem a parceria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth">
                <button className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors font-medium">
                  Começar Gratuitamente
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-white">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Nós Juntos" className="h-8 w-auto" />
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
                  <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#benefits" className="text-muted-foreground hover:text-primary transition-colors">
                    Benefícios
                  </a>
                </li>
                <li>
                  <a href="#demo" className="text-muted-foreground hover:text-primary transition-colors">
                    Demonstração
                  </a>
                </li>
                <li>
                  <Link href="/auth" className="text-muted-foreground hover:text-primary transition-colors">
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
              <a href="mailto:contato@nosjuntos.app" className="text-primary hover:underline">
                contato@nosjuntos.app
              </a>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Nós Juntos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;