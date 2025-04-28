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
import { useBiometricAuth } from "@/hooks/use-biometric-auth";
import { useEffect, useState } from "react";
import { Fingerprint, ArrowRight, User, Mail, Lock, Phone } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name is required"),
  email: z.string(),
  phoneNumber: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { loginMutation, registerMutation, user } = useAuth();
  const [, navigate] = useLocation();
  const {
    isSupported,
    loginWithBiometric,
    isPending: biometricIsPending,
  } = useBiometricAuth();
  const [usernameForBiometric, setUsernameForBiometric] = useState("");
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<
    boolean | null
  >(null);

  // Extrair parâmetros da URL para redirecionamento após autenticação
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect");

  // Verificar se a biometria está disponível
  useEffect(() => {
    setIsBiometricAvailable(isSupported);
  }, [isSupported]);

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
    // Se existe um parâmetro de redirecionamento na URL, usá-lo
    if (redirectTo === "welcome") {
      navigate("/welcome");
    } else {
      navigate("/");
    }
    // Don't return null here, it causes the hooks error
  }

  const onSubmitLogin = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onSubmitRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // Função para verificar credenciais biométricas
  const handleCheckBiometric = () => {
    const username = loginForm.getValues("username");
    if (!username) {
      loginForm.setError("username", {
        type: "manual",
        message: "Digite seu nome de usuário para usar biometria",
      });
      return;
    }

    setUsernameForBiometric(username);
    setShowBiometricOption(true);
  };

  // Função para realizar login biométrico
  const handleBiometricLogin = async () => {
    if (!usernameForBiometric) return;

    try {
      const result = await loginWithBiometric(usernameForBiometric);

      if (result.success) {
        // Redirecionamento ocorrerá automaticamente pela verificação de 'user'
      }
    } catch (error) {
      console.error("Erro ao fazer login com biometria:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="./logo.png" alt="Nós Juntos" className="h-20" />
          </div>
          <small className="text-muted-foreground px-10 block">
            Cada dia é uma nova oportunidade de nos escolhermos — mesmo nas
            pequenas tarefas do cotidiano. Vamos juntos transformar a rotina em
            uma jornada de crescimento e amor.
          </small>
        </div>

        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {!showBiometricOption ? (
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
                            <FormLabel className="flex items-center gap-2">
                              <User
                                size={16}
                                className="text-muted-foreground"
                              />
                              Email ou Nome de Usuário
                            </FormLabel>
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
                            <FormLabel className="flex items-center gap-2">
                              <Lock
                                size={16}
                                className="text-muted-foreground"
                              />
                              Senha
                            </FormLabel>
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

                      <div className="space-y-2">
                        <Button
                          type="submit"
                          className="w-full flex items-center gap-2 justify-center"
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? (
                            "Entrando..."
                          ) : (
                            <>
                              Entrar
                              <ArrowRight size={16} />
                            </>
                          )}
                        </Button>

                        {isBiometricAvailable && (
                          <div className="mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full flex items-center gap-2 justify-center"
                              onClick={handleCheckBiometric}
                              disabled={loginMutation.isPending}
                            >
                              <Fingerprint size={18} />
                              Entrar com biometria
                            </Button>
                          </div>
                        )}
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="py-6 flex flex-col items-center space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-medium mb-2">
                        Login com Biometria
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Use sua impressão digital ou reconhecimento facial para
                        entrar
                      </p>
                    </div>

                    <Button
                      className="w-full h-16 flex flex-col gap-1 items-center justify-center"
                      onClick={handleBiometricLogin}
                      disabled={biometricIsPending}
                    >
                      <Fingerprint size={24} />
                      <span>
                        {biometricIsPending ? "Verificando..." : "Autenticar"}
                      </span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBiometricOption(false)}
                    >
                      Voltar para login com senha
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                          <FormLabel className="flex items-center gap-2">
                            <User size={16} className="text-muted-foreground" />
                            Nome Completo
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Mail size={16} className="text-muted-foreground" />
                            Email
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <User size={16} className="text-muted-foreground" />
                            Nome de Usuário
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Lock size={16} className="text-muted-foreground" />
                            Senha
                          </FormLabel>
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
                          <FormLabel className="flex items-center gap-2">
                            <Phone
                              size={16}
                              className="text-muted-foreground"
                            />
                            Telefone (opcional)
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="(00) 00000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full flex items-center gap-2 justify-center"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        "Cadastrando..."
                      ) : (
                        <>
                          Cadastrar
                          <ArrowRight size={16} />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* <p className="text-sm text-center text-gray-500 mt-6">
          Ao continuar, você concorda com nossos{" "}
          <a href="#" className="text-primary">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="text-primary">
            Política de Privacidade
          </a>
          .
        </p> */}
      </div>
    </div>
  );
}
