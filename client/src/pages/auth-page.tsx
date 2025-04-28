import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, Key, Loader2, Lock, Mail, User, User2, UserCheck } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário ou email é obrigatório").toLowerCase(),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Digite um email válido"),
  phoneNumber: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [isLoadingInviteData, setIsLoadingInviteData] = useState(false);

  // Extrair parâmetros da URL para redirecionamento após autenticação
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect");
  const inviteToken = urlParams.get("token"); // Pegar o token de convite da URL, se existir

  // Buscar informações do convite se houver um token
  useEffect(() => {
    if (inviteToken) {
      setIsLoadingInviteData(true);
      apiRequest("GET", `/api/invites/validate?token=${inviteToken}`)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Convite inválido ou expirado");
        })
        .then(data => {
          setInviterName(data.inviterName);
        })
        .catch(error => {
          console.error("Erro ao validar convite:", error);
        })
        .finally(() => {
          setIsLoadingInviteData(false);
        });
    }
  }, [inviteToken]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  // Redirect if already logged in - moved after all hooks are called
  if (user) {
    // Se existe um parâmetro de redirecionamento na URL, usá-lo de acordo com o tipo
    if (redirectTo === "welcome") {
      navigate("/welcome");
    } else if (redirectTo === "invite" && inviteToken) {
      // Se veio de um convite, redirecionar para a página de aceitação do convite
      navigate(`/accept-invite/${inviteToken}`);
    } else {
      navigate("/calendar");
    }
    // Don't return null here, it causes the hooks error
  }

  const onSubmitLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onSubmitRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex md:flex-row flex-col">
      {/* Coluna esquerda (formulário) */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="./logo.png" alt="Nós Juntos" className="h-20" />
            </div>
            
            {isLoadingInviteData ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                <span className="text-sm text-muted-foreground">Carregando informações do convite...</span>
              </div>
            ) : inviteToken && inviterName ? (
              <div className="mb-6 bg-gradient-to-r from-primary/20 to-rose-500/20 p-5 rounded-lg text-left">
                <div className="flex items-center mb-2">
                  <Heart className="text-rose-500 h-5 w-5 mr-2" />
                  <h3 className="font-semibold text-primary">Convite de {inviterName}!</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {inviterName} está te convidando para se conectar no Nós Juntos. 
                  Faça login ou crie uma conta para aceitar o convite e começar a 
                  organizar a vida a dois de forma mais conectada e harmoniosa.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary mb-2">Nós Juntos</h2>
                <p className="text-sm text-muted-foreground">
                  Transformando a rotina do casal em uma jornada de conexão, crescimento e amor.
                </p>
              </div>
            )}
          </div>

          <Tabs defaultValue={inviteToken ? "register" : "login"} className="space-y-6">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border border-muted">
                <CardContent className="pt-6 space-y-4">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onSubmitLogin)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email ou Nome de Usuário</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Digite seu email ou nome de usuário"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="********"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          "Entrar"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border border-muted">
                <CardContent className="pt-6 space-y-4">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onSubmitRegister)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Seu nome" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="seu@email.com"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome de Usuário</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="seunome" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="password"
                                  placeholder="********"
                                  className="pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Cadastrando...
                          </>
                        ) : (
                          "Cadastrar"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </p>
        </div>
      </div>

      {/* Coluna direita (hero section) - visível apenas em telas médias e maiores */}
      <div className="md:w-1/2 w-full bg-gradient-to-br from-primary/30 to-primary/5 hidden md:flex flex-col justify-center items-center p-12">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm shadow-xl mb-6">
              <Heart className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Organize a vida a dois com mais amor</h1>
            <p className="text-lg mb-8">
              Compartilhem calendários, tarefas domésticas e fortaleçam sua conexão diária.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.995 13.7H12.005M8.294 13.7H8.304M8.294 16.7H8.304" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.995 16.7H12.005M15.695 13.7H15.705M15.695 16.7H15.705" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Calendário Compartilhado
              </h3>
              <p className="text-sm opacity-75">Sincronizem eventos, consultas e compromissos importantes do casal.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.37 8.88H17.62M6.38 8.88L7.13 9.63L9.38 7.38M12.37 15.88H17.62M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Tarefas Domésticas
              </h3>
              <p className="text-sm opacity-75">Organizem e dividam as responsabilidades da casa de forma equilibrada.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 8.5H14.5M6 16.5H8M10.5 16.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 14.03V16.11C22 19.62 21.11 20.5 17.56 20.5H6.44C2.89 20.5 2 19.62 2 16.11V7.89C2 4.38 2.89 3.5 6.44 3.5H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 9.5C21.1046 9.5 22 8.60457 22 7.5C22 6.39543 21.1046 5.5 20 5.5C18.8954 5.5 18 6.39543 18 7.5C18 8.60457 18.8954 9.5 20 9.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Notificações
              </h3>
              <p className="text-sm opacity-75">Recebam lembretes sobre eventos importantes e tarefas pendentes.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="bg-primary/20 rounded-full p-1 mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.1601 10.87C12.0601 10.86 11.9401 10.86 11.8301 10.87C9.4501 10.79 7.5601 8.84 7.5601 6.44C7.5601 3.99 9.5401 2 12.0001 2C14.4501 2 16.4401 3.99 16.4401 6.44C16.4301 8.84 14.5401 10.79 12.1601 10.87Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.16021 14.56C4.74021 16.18 4.74021 18.82 7.16021 20.43C9.9102 22.27 14.4202 22.27 17.1702 20.43C19.5902 18.81 19.5902 16.17 17.1702 14.56C14.4302 12.73 9.9202 12.73 7.16021 14.56Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                Conexão de Casal
              </h3>
              <p className="text-sm opacity-75">Fortaleçam a comunicação e cumplicidade através da organização diária.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
