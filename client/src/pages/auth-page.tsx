import { useState, useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLocation } from "wouter";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Página de autenticação simples (login/registro)
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  
  // Redirecionar se já estiver logado
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Se estiver carregando, mostrar loader
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Formulário (lado esquerdo) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Por Nós</h1>
            <p className="mt-2 text-gray-600">Todo dia é uma nova chance de nos escolher</p>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex-1 py-2 text-center ${
                activeTab === "login"
                  ? "border-b-2 border-primary text-primary font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              className={`flex-1 py-2 text-center ${
                activeTab === "register"
                  ? "border-b-2 border-primary text-primary font-medium"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("register")}
            >
              Cadastro
            </button>
          </div>
          
          {/* Formulário ativo */}
          <div className="space-y-6">
            {activeTab === "login" ? (
              <LoginForm />
            ) : (
              <RegisterForm />
            )}
          </div>
        </div>
      </div>
      
      {/* Hero (lado direito) */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-primary to-primary-400 hidden md:flex flex-col items-center justify-center text-white p-8">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-bold mb-6">Organize sua vida a dois</h2>
          <p className="text-lg mb-8">
            Por Nós é a plataforma ideal para casais que desejam organizar sua vida de forma
            simples e eficiente. Compartilhe eventos, planeje tarefas domésticas e fortaleça
            sua relação.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-bold mb-2">Calendário Compartilhado</p>
              <p className="text-sm">Visualize eventos e compromissos juntos</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-bold mb-2">Tarefas Domésticas</p>
              <p className="text-sm">Organize as responsabilidades do lar</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-bold mb-2">Notificações</p>
              <p className="text-sm">Lembretes de eventos e tarefas importantes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Formulário de login
function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.username || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    // Enviar requisição de login
    loginMutation.mutate(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Usuário
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex justify-center"
      >
        {loginMutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}

// Formulário de registro
function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phoneNumber: "",
  });
  const { registerMutation } = useAuth();
  const { toast } = useToast();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validação com Zod
      const schema = z.object({
        username: z.string().min(3, "Usuário deve ter pelo menos 3 caracteres"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Email inválido"),
        phoneNumber: z.string().optional(),
      });
      
      schema.parse(formData);
      
      // Enviar requisição de registro
      registerMutation.mutate(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => err.message).join(", ");
        toast({
          title: "Erro de validação",
          description: errorMessages,
          variant: "destructive",
        });
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nome completo
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Celular (opcional)
        </label>
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Usuário
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>
      
      <button
        type="submit"
        disabled={registerMutation.isPending}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex justify-center"
      >
        {registerMutation.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Cadastrar"
        )}
      </button>
    </form>
  );
}