import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { UserPlus, Heart, LogIn, UserCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema de validação para o formulário de registro
const registerSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// Schema de validação para o formulário de login
const loginSchema = z.object({
  username: z.string().min(1, "Nome de usuário ou email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface InviteInfo {
  invite: {
    id: number;
    status: string;
    createdAt: string;
  };
  inviter: {
    id: number;
    name: string;
  };
}

export default function PartnerInvitePage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Extrair o token do invite da URL
  const urlParams = new URLSearchParams(window.location.search);
  const inviteToken = urlParams.get('token');
  
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
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // Buscar informações do convite quando a página carrega
  useEffect(() => {
    async function fetchInviteInfo() {
      if (!inviteToken) {
        setError("Token de convite não encontrado");
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/partner/invite/${inviteToken}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Convite não encontrado ou expirado");
          } else {
            const data = await response.json();
            setError(data.message || "Erro ao buscar informações do convite");
          }
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        setInviteInfo(data);
        
        // Preencher o email no formulário se estiver disponível
        if (data.invite.email) {
          registerForm.setValue("email", data.invite.email);
        }
      } catch (err) {
        console.error("Erro ao buscar convite:", err);
        setError("Erro ao processar seu convite. Por favor, tente novamente.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchInviteInfo();
  }, [inviteToken, registerForm]);
  
  const onSubmitRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        if (user && inviteToken) {
          acceptInvite();
        }
      }
    });
  };
  
  const onSubmitLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        if (inviteToken) {
          acceptInvite();
        }
      }
    });
  };
  
  const acceptInvite = async () => {
    if (!inviteToken || !user) return;
    
    setAcceptLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/partner/accept', { token: inviteToken });
      
      if (!response.ok) {
        const data = await response.json();
        toast({
          title: "Erro ao aceitar convite",
          description: data.message || "Ocorreu um erro ao aceitar o convite.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Convite aceito com sucesso!",
        description: "Vocês agora estão conectados como parceiros.",
        variant: "default"
      });
      
      // Redirecionar para a página de boas-vindas após aceitar o convite
      navigate("/welcome");
    } catch (err) {
      console.error("Erro ao aceitar convite:", err);
      toast({
        title: "Erro ao aceitar convite",
        description: "Ocorreu um erro ao processar o convite. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setAcceptLoading(false);
    }
  };
  
  // Se o usuário já aceitou o convite, redirecionar para a home
  useEffect(() => {
    if (user && inviteInfo && inviteInfo.invite.status === "accepted") {
      navigate("/");
    }
  }, [user, inviteInfo, navigate]);
  
  // Renderização condicional baseada no estado de carregamento e no resultado
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando informações do convite...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Erro no Convite</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/">Voltar para a página inicial</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-center">Aceitar Convite</CardTitle>
            <CardDescription className="text-center">
              {inviteInfo ? (
                <motion.p
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="font-semibold">{inviteInfo.inviter.name}</span> convidou você para se conectar no Nós Juntos! Ao aceitar, vocês poderão compartilhar calendários, tarefas e muito mais.
                </motion.p>
              ) : (
                <p>Vocês poderão compartilhar calendários, tarefas e muito mais.</p>
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={acceptInvite} disabled={acceptLoading}>
              {acceptLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Aceitar Convite
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto bg-primary/10 p-3 rounded-full inline-flex mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {inviteInfo ? (
              <motion.span
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Convite de <span className="text-primary">{inviteInfo.inviter.name}</span>
              </motion.span>
            ) : (
              "Convite para o Nós Juntos"
            )}
          </h1>
          <p className="text-muted-foreground">
            Para aceitar o convite, você precisa criar uma conta ou entrar com sua conta existente.
          </p>
        </div>

        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="register">
              <UserCircle className="h-4 w-4 mr-2" />
              Criar Conta
            </TabsTrigger>
            <TabsTrigger value="login">
              <LogIn className="h-4 w-4 mr-2" />
              Entrar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
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
                            <Input placeholder="Seu nome" {...field} />
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
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                            />
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
                            <Input placeholder="seunome" {...field} />
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
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                            />
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
                        "Cadastrar e Aceitar Convite"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card>
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
                            <Input
                              type="text"
                              placeholder="digite seu email ou nome de usuário"
                              {...field}
                            />
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
                            <Input
                              type="password"
                              placeholder="********"
                              {...field}
                            />
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
                        "Entrar e Aceitar Convite"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}