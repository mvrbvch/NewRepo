import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/onboarding/complete", {});
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      setTimeout(() => {
        navigate("/");
      }, 1000);
      toast({
        title: "Configuração concluída",
        description: "Seu ambiente foi configurado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description:
          "Não foi possível concluir a configuração. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (step === 4) {
      completeOnboardingMutation.mutate();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  const toggleCalendarSelection = (provider: string) => {
    if (selectedCalendars.includes(provider)) {
      setSelectedCalendars(selectedCalendars.filter((cal) => cal !== provider));
    } else {
      setSelectedCalendars([...selectedCalendars, provider]);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-screen bg-white">
      {/* Progress indicator */}
      <div className="flex justify-between px-6 pt-4">
        <div className="flex space-x-1">
          <div
            className={`h-1 w-8 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-1 w-8 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-1 w-8 rounded-full ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-1 w-8 rounded-full ${step >= 4 ? "bg-primary" : "bg-gray-200"}`}
          ></div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={skipOnboarding}
        >
          Pular
        </Button>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8">
        <div className="w-full max-w-md">
          {step === 1 && (
            <div className="text-center mb-8">
              <div className="bg-primary/10 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                <span className="material-icons text-primary text-3xl">
                  waving_hand
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Bem-vindo(a), {user?.name}!
              </h2>
              <p className="text-gray-600 mb-4">
                Vamos configurar o Por Nós para você começar a usar.
              </p>
              <p className="text-gray-600">
                Se você está se cadastrando por aqui, é porque decidiu dar um
                upgrade na vida 💫 — e o melhor de tudo: ao lado do amor da sua
                vida ❤️! <br />
                <br />É hora de construir uma nova rotina, criar hábitos
                incríveis e organizar o caos com leveza, parceria e muito amor.{" "}
                <br />
                <br />
                Porque juntos, tudo flui melhor, fica mais divertido e tem muito
                mais sentido! 🚀💑✨ <br />
                <br />
                OU… se você está aqui porque foi convidado, é sinal de que
                alguém te ama muito 💌 e acredita que vocês merecem viver algo
                ainda mais especial juntos. <br />
                <br />
                Alguém que quer dividir o melhor da vida com você — com mais
                conexão, equilíbrio e alegria! 🌈👫💖
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="mb-8">
              <div className="text-center">
                <div className="bg-primary/10 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <span className="material-icons text-primary text-3xl">
                    calendar_today
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Importe seus calendários
                </h2>
                <p className="text-gray-600 mb-6">
                  Conecte com seus calendários existentes para não perder nenhum
                  compromisso.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  disabled
                  style={{ opacity: 0.5 }}
                  className={`flex items-center justify-between w-full ${
                    selectedCalendars.includes("google")
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-300"
                  } border rounded-lg p-4 disabled`}
                  onClick={() => toggleCalendarSelection("google")}
                >
                  <div className="flex items-center">
                    <span className="material-icons text-blue-500 mr-3">
                      event_note
                    </span>
                    <span>Google Calendar (rs ainda não)</span>
                  </div>
                  <span className="material-icons text-gray-400">
                    {selectedCalendars.includes("google")
                      ? "check_circle"
                      : "chevron_right"}
                  </span>
                </button>

                <button
                  disabled
                  style={{ opacity: 0.5 }}
                  className={`flex items-center justify-between w-full disabled ${
                    selectedCalendars.includes("apple")
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-300"
                  } border rounded-lg p-4`}
                  onClick={() => toggleCalendarSelection("apple")}
                >
                  <div className="flex items-center">
                    <span className="material-icons text-red-500 mr-3">
                      event_available
                    </span>
                    <span>Apple Calendar (rs ainda não)</span>
                  </div>
                  <span className="material-icons text-gray-400">
                    {selectedCalendars.includes("apple")
                      ? "check_circle"
                      : "chevron_right"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mb-8">
              <div className="text-center">
                <div className="bg-primary/10 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <span className="material-icons text-primary text-3xl">
                    language
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Escolha seu idioma e região
                </h2>
                <p className="text-gray-600 mb-6">
                  Seu calendário usará estes dados para mostrar datas e feriados
                  corretos.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Idioma
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="pt-BR" selected>
                      Português (Brasil)
                    </option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Região
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="BR" selected>
                      Brasil
                    </option>
                    <option value="US">Estados Unidos</option>
                    <option value="PT">Portugal</option>
                    <option value="ES">Espanha</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Formato de data
                  </label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="dd/mm/yyyy" selected>
                      DD/MM/AAAA
                    </option>
                    <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                    <option value="yyyy/mm/dd">AAAA/MM/DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mb-8">
              <div className="text-center">
                <div className="bg-primary/10 inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                  <span className="material-icons text-primary text-3xl">
                    favorite
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  Convide seu parceiro
                </h2>
                <p className="text-gray-600 mb-6">
                  Compartilhe seus eventos e organize a agenda juntos. (Você
                  também pode fazer isso depois)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email ou telefone
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Digite o email ou telefone"
                  />
                </div>

                <Button variant="outline" className="w-full">
                  Convidar depois
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6">
        <div className="flex space-x-3">
          {step > 1 && (
            <Button variant="outline" onClick={prevStep} className="flex-1">
              Voltar
            </Button>
          )}
          <Button onClick={nextStep} className="flex-1">
            {step === 4 ? "Concluir" : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
