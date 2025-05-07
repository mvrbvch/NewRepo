import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
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
import {
  Heart,
  Key,
  Loader2,
  Lock,
  Mail,
  User,
  User2,
  UserCheck,
  ThumbsUp,
  CalendarDays,
  Home,
  Coffee,
  Calendar,
} from "lucide-react";
import { useHookFormMask, withMask } from "use-mask-input";

// Mensagens de erro personalizadas e descontraídas
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Ops! Esqueceu de nos dizer quem você é?")
    .toLowerCase(),
  password: z.string().min(1, "Sem senha não tem como entrar, viu?"),
});

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Seu nome de usuário precisa de pelo menos 3 letrinhas, tá?"),
  password: z
    .string()
    .min(6, "Uma senha com 6+ caracteres deixa tudo mais seguro! 🔒"),
  name: z.string().min(2, "Como vamos te chamar com menos de 2 letras? 😊"),
  birthday: z
    .string()
    .min(1, "Juro que é só pra nao deixar ninguem esquecer do seu dia "),

  email: z
    .string()
    .email("Hmm, esse email parece meio estranho... Confere pra gente?"),
  phoneNumber: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
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
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Convite inválido ou expirado");
        })
        .then((data) => {
          setInviterName(data.inviterName);
        })
        .catch((error) => {
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

  const { register } = useForm();

  const registerWithMask = useHookFormMask(register);

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      phoneNumber: "",
      birthday: "DD/MM/AAAA",
    },
  });

  // Redirect if already logged in - moved after all hooks are called
  if (user) {
    // Se existe um parâmetro de redirecionamento na URL, usá-lo de acordo com o tipo
    if (redirectTo === "welcome") {
      navigate("/welcome");
    } else if (redirectTo === "invite" && inviteToken) {
      // Se veio de um convite, redirecionar para a página de aceitação do convite
      navigate(`/partner-invite?token=${inviteToken}`);
    } else {
      navigate("/dashboard");
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
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center px-6 py-20 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="./logo.png" alt="Nós Juntos" className="h-20" />
            </div>

            {isLoadingInviteData ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Carregando informações do convite...
                </span>
              </div>
            ) : inviteToken && inviterName ? (
              <div className="mb-6 bg-gradient-to-r from-primary/20 to-rose-500/20 p-5 rounded-lg text-left">
                <div className="flex items-center mb-2">
                  <Heart className="text-rose-500 h-5 w-5 mr-2" />
                  <h3 className="font-semibold text-primary">
                    Convite de {inviterName}!
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {inviterName} está te convidando para se conectar no Nós
                  Juntos. Faça login ou crie uma conta para aceitar o convite e
                  começar a organizar a vida a dois de forma mais conectada e
                  harmoniosa.
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Transformando a rotina do casal em uma jornada de conexão,
                  crescimento e amor.
                </p>
              </div>
            )}
          </div>

          <Tabs
            defaultValue={inviteToken ? "register" : "login"}
            className="space-y-6"
          >
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
                                <Input
                                  placeholder="Seu nome"
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
                                <Input
                                  placeholder="Escolha um nome de usuário"
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
                        name="birthday"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Controller
                                  name="birthday"
                                  render={({ field }) => {
                                    return (
                                      <Input
                                        {...field}
                                        style={{
                                          paddingLeft: "35px",
                                        }}
                                        ref={(ref) => {
                                          withMask("99/99/9999", {
                                            inputType: "number",
                                            inputmode: "numeric",
                                            inputFormat: "DD/MM/YYYY",
                                            outputFormat: "YYYY-MM-DD",
                                          })(ref);
                                          field.ref(ref);
                                        }}
                                      />
                                    );
                                  }}
                                />
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

          {/* <p className="text-xs text-center text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">
              Termos de Serviço
            </a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">
              Política de Privacidade
            </a>
            .
          </p> */}
        </div>
      </div>

      {/* Coluna direita (hero section) - visível apenas em telas médias e maiores */}
      <div className="md:w-1/2 w-full bg-gradient-to-br from-primary/30 via-rose-500/10 to-primary/5 hidden md:flex flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] right-[-5%] w-[20rem] h-[20rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[10%] left-[-5%] w-[15rem] h-[15rem] rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute top-[40%] left-[30%] w-[10rem] h-[10rem] rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="max-w-lg relative z-10">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-rose-500/20 backdrop-blur-sm shadow-xl mb-6">
              <Heart className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold mb-5 bg-gradient-to-r from-primary to-rose-500 text-transparent bg-clip-text">
              Juntos para uma vida mais conectada e organizada
            </h1>
            <p
              className="text-lg mb-8 text-gray-700 leading-relaxed"
              style={{ fontSize: 12 }}
            >
              Construam a rotina a dois com mais leveza, união e organização.
              Porque juntos, cada momento se torna especial.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-md mb-2">
                  Tudo em um só lugar
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontSize: 12 }}
                >
                  Esqueçam as agendas separadas e as listas de tarefas perdidas.
                  No{" "}
                  <span className="font-medium text-primary">Nós Juntos</span>,
                  tudo fica centralizado e acessível para vocês dois.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="bg-rose-500/10 p-3 rounded-full">
                <Coffee className="h-6 w-6 text-rose-500" />
              </div>
              <div>
                <h3 className="font-semibold text-md mb-2">
                  Mais tempo de qualidade
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontSize: 12 }}
                >
                  Com a organização mais eficiente, vocês terão mais tempo para
                  o que realmente importa: momentos de conexão e carinho um com
                  o outro.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/60 backdrop-blur-sm rounded-xl p-5 shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className="bg-primary/10 p-3 rounded-full">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-md mb-2">
                  Equilíbrio no lar
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
                  style={{ fontSize: 12 }}
                >
                  Acabou a dúvida sobre "de quem é a vez". Distribuam as tarefas
                  de forma justa e acompanhem juntos o que já foi feito e o que
                  falta fazer.
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 italic">
                "Individualmente, somos uma gota. Juntos, somos um oceano."
              </p>
              <p className="text-xs text-gray-400">— Ryunosuke Satoro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
