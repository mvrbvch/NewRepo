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
import { useNativeBiometricAuth } from "@/hooks/use-native-biometric-auth";
import { useEffect, useState } from "react";
import {
  Fingerprint,
  ArrowRight,
  User,
  Mail,
  Lock,
  Phone,
  TabletSmartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // WebAuthn (Navegador)
  const {
    isSupported,
    loginWithBiometric,
    isPending: biometricIsPending,
  } = useBiometricAuth();

  // Biometria nativa (iOS/Android)
  const {
    isSupported: isNativeSupported,
    platform: nativePlatform,
    registerBiometric: registerNativeBiometric,
    loginWithBiometric: loginWithNativeBiometric,
    isPending: isNativePending,
  } = useNativeBiometricAuth();

  const [usernameForBiometric, setUsernameForBiometric] = useState("");
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<
    boolean | null
  >(null);

  // Estado para o diálogo de configuração de biometria nativa no primeiro login
  const [showNativeBiometricDialog, setShowNativeBiometricDialog] =
    useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Extrair parâmetros da URL para redirecionamento após autenticação
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTo = urlParams.get("redirect");

  // Verificar se a biometria está disponível
  useEffect(() => {
    setIsBiometricAvailable(isSupported);
  }, [isSupported]);

  // Efeito para detectar login bem-sucedido e oferecer configuração de biometria nativa
  useEffect(() => {
    if (user && isNativeSupported && justLoggedIn) {
      // Oferecer registro biométrico nativo ao fazer login
      setShowNativeBiometricDialog(true);
      // Resetar para não mostrar repetidamente
      setJustLoggedIn(false);
    }
  }, [user, isNativeSupported, justLoggedIn]);

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
    loginMutation.mutate(data, {
      onSuccess: () => {
        // Marcar como recém-logado para oferecer configuração de biometria nativa
        if (isNativeSupported) {
          setJustLoggedIn(true);
        }
      },
    });
  };

  const onSubmitRegister = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // Função para registrar biometria nativa após login bem-sucedido
  const handleRegisterNativeBiometricAfterLogin = async () => {
    try {
      if (!deviceName.trim()) {
        toast({
          title: "Nome do dispositivo necessário",
          description:
            "Por favor, forneça um nome para identificar este dispositivo",
          variant: "destructive",
        });
        return;
      }

      const result = await registerNativeBiometric(deviceName);

      if (result.success) {
        toast({
          title: "Biometria ativada",
          description: "Seu dispositivo foi registrado para login biométrico",
          variant: "default",
        });
        setShowNativeBiometricDialog(false);
        setDeviceName("");
      }
    } catch (error) {
      console.error("Erro ao registrar biometria nativa:", error);
      toast({
        title: "Falha no registro",
        description: "Não foi possível registrar sua biometria",
        variant: "destructive",
      });
    }
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

    // Log para diagnóstico
    if (isNativeSupported) {
      console.log(
        "Biometria nativa disponível para plataforma:",
        nativePlatform,
      );
      console.log(
        "Modo PWA:",
        window.matchMedia("(display-mode: standalone)").matches,
      );
    } else {
      console.log("Biometria nativa não disponível, usando WebAuthn");
    }

    setUsernameForBiometric(username);
    setShowBiometricOption(true);
  };

  // Função para realizar login biométrico
  const handleBiometricLogin = async () => {
    if (!usernameForBiometric) return;

    try {
      let result;

      // Verificar se estamos em ambiente móvel (PWA) e usar a biometria nativa
      if (
        isNativeSupported &&
        window.matchMedia("(display-mode: standalone)").matches
      ) {
        console.log(
          "Usando login biométrico nativo para",
          usernameForBiometric,
        );
        result = await loginWithNativeBiometric(usernameForBiometric);
      } else {
        // Caso contrário, usar WebAuthn para navegadores
        console.log("Usando login WebAuthn para", usernameForBiometric);
        result = await loginWithBiometric(usernameForBiometric);
      }

      if (result.success) {
        // Redirecionamento ocorrerá automaticamente pela verificação de 'user'
        console.log("Login biométrico bem-sucedido!");
      }
    } catch (error) {
      console.error("Erro ao fazer login com biometria:", error);
      toast({
        title: "Falha na autenticação biométrica",
        description:
          "Não foi possível autenticar com biometria. Tente novamente ou use sua senha.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      {/* Diálogo para registrar biometria nativa após login bem-sucedido */}
      <Dialog
        open={showNativeBiometricDialog}
        onOpenChange={setShowNativeBiometricDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TabletSmartphone className="h-5 w-5" />
              Ativar autenticação biométrica
            </DialogTitle>
            <DialogDescription>
              Você pode usar sua{" "}
              {nativePlatform === "ios"
                ? "Face ID/Touch ID"
                : "impressão digital"}{" "}
              para fazer login de forma rápida e segura neste dispositivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="deviceName" className="text-sm font-medium">
                Nome do dispositivo
              </label>
              <Input
                id="deviceName"
                placeholder={`Meu ${nativePlatform === "ios" ? "iPhone" : "celular Android"}`}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Esse nome será usado para identificar este dispositivo nas suas
                configurações.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNativeBiometricDialog(false)}
            >
              Agora não
            </Button>
            <Button
              type="button"
              onClick={handleRegisterNativeBiometricAfterLogin}
              disabled={isNativePending}
              className="gap-2"
            >
              <Fingerprint className="h-4 w-4" />
              {isNativePending ? "Registrando..." : "Ativar biometria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
