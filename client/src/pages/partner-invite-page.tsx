import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { randomBytes } from "crypto";

export default function PartnerInvitePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams();
  const { token } = params;

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [qrCodeVisible, setQrCodeVisible] = useState(false);

  // For accepting an invite
  const [inviterName, setInviterName] = useState("");
  const [isLoadingInvite, setIsLoadingInvite] = useState(!!token);
  const [inviteError, setInviteError] = useState("");

  // Fetch invite details if token is present
  useEffect(() => {
    if (token) {
      setIsLoadingInvite(true);
      fetch(`/api/partner/invite/${token}`)
        .then((res) => {
          if (!res.ok) throw new Error("Convite não encontrado ou expirado");
          return res.json();
        })
        .then((data) => {
          setInviterName(data.inviter.name);
          setIsLoadingInvite(false);
        })
        .catch((err) => {
          setInviteError(err.message);
          setIsLoadingInvite(false);
        });
    }
  }, [token]);

  const inviteMutation = useMutation({
    mutationFn: async (data: { email?: string; phoneNumber?: string }) => {
      const res = await apiRequest("POST", "/api/partner/invite", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Convite enviado",
        description: "Seu parceiro receberá o convite em breve.",
      });

      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description:
          "Não foi possível enviar o convite. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/partner/accept", { token });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Convite aceito",
        description:
          "Agora vocês estão conectados e podem compartilhar eventos!",
      });
      navigate("/calendar");
    },
    onError: () => {
      if (!user) {
        navigate("/calendar");
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível aceitar o convite. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSendInvite = () => {
    if (!email && !phoneNumber) {
      toast({
        title: "Erro",
        description: "Informe um email ou telefone para enviar o convite.",
        variant: "destructive",
      });
      return;
    }

    inviteMutation.mutate({
      email: email || undefined,
      phoneNumber: phoneNumber || undefined,
    });
  };

  const handleAcceptInvite = () => {
    if (token) {
      acceptInviteMutation.mutate(token);
    }
  };

  const handleGenerateLink = () => {
    inviteMutation.mutate({});
  };

  const handleShowQrCode = () => {
    if (!inviteLink) {
      handleGenerateLink();
    }
    setQrCodeVisible(true);
  };

  const handleBack = () => {
    navigate("/calendar");
  };

  // Verificar se o usuário está autenticado quando acessando um convite
  useEffect(() => {
    // Se temos um token de convite mas o usuário não está logado, redirecionar para autenticação
    if (token && !user && !isLoadingInvite) {
      // Salvar o token de convite no sessionStorage para usar após login/registro
      sessionStorage.setItem('pendingInviteToken', token);
      
      // Redirecionar para a página de autenticação com parâmetro de redirecionamento
      navigate(`/auth?redirect=invite&token=${token}`);
      
      toast({
        title: "Autenticação necessária",
        description: "Você precisa entrar ou criar uma conta para aceitar o convite.",
      });
    }
  }, [token, user, isLoadingInvite, navigate]);

  // Accepting an invite view
  if (token) {
    if (isLoadingInvite) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    if (inviteError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center mb-6">
            <span className="material-icons text-red-500 text-5xl mb-2">
              error
            </span>
            <h1 className="text-2xl font-bold">Erro no convite</h1>
            <p className="text-gray-600 mt-2">{inviteError}</p>
          </div>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <span className="material-icons">arrow_back</span>
          </Button>
          <h1 className="text-lg font-semibold">Convite de parceiro</h1>
          <div className="w-8"></div>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mx-auto w-32 h-32 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <span className="material-icons text-5xl text-secondary">
                  favorite
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2">
                Você acaba de receber um convite incrível!
              </h2>
              <p className="text-gray-600">
                Se você está aqui, é porque alguém muito especial,{" "}
                <strong>{inviterName}</strong>, acredita que a vida ao seu lado
                pode ser ainda mais maravilhosa. <br /> <br /> É o momento
                perfeito para criar uma rotina cheia de amor, equilíbrio e
                diversão, onde tudo flui melhor e fica mais significativo.
                Juntos, a jornada é mais leve e cheia de momentos incríveis!
                💫❤️
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleAcceptInvite}
                className="w-full"
                disabled={acceptInviteMutation.isPending}
              >
                {acceptInviteMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="material-icons text-sm mr-2">check</span>
                )}
                Aceitar convite
              </Button>

              <Button variant="outline" onClick={handleBack} className="w-full">
                Rejeitar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sending an invite view
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <span className="material-icons">arrow_back</span>
        </Button>
        <h1 className="text-lg font-semibold">Convidar parceiro</h1>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto w-32 h-32 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
            <span className="material-icons text-5xl text-secondary">
              favorite
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">Compartilhe sua rotina</h2>
          <p className="text-gray-600">
            Convide seu parceiro(a) para compartilhar eventos e organizar a
            agenda juntos.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite o email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone (opcional)
            </label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Digite o telefone"
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSendInvite}
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enviar convite
          </Button>

          <div className="relative flex items-center my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-3 text-gray-500 text-sm">ou</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              onClick={handleGenerateLink}
            >
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-3">link</span>
                <span>Gerar link de convite</span>
              </div>
              <span className="material-icons text-gray-400">
                chevron_right
              </span>
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-between"
              onClick={handleShowQrCode}
            >
              <div className="flex items-center">
                <span className="material-icons text-gray-500 mr-3">
                  qr_code_2
                </span>
                <span>Mostrar QR Code</span>
              </div>
              <span className="material-icons text-gray-400">
                chevron_right
              </span>
            </Button>
          </div>

          {inviteLink && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Link de convite:</p>
              <div className="flex">
                <Input
                  readOnly
                  value={`${window.location.origin}/accept-invite/${inviteLink}`}
                  className="text-sm"
                />
                <Button
                  variant="ghost"
                  className="ml-2"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/accept-invite/${inviteLink}`
                    );
                    toast({
                      title: "Link copiado",
                      description:
                        "O link de convite foi copiado para sua área de transferência.",
                    });
                  }}
                >
                  <span className="material-icons">content_copy</span>
                </Button>
              </div>
            </div>
          )}

          {qrCodeVisible && inviteLink && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm font-medium mb-2">QR Code:</p>
              <div className="bg-white p-4 inline-block rounded">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/accept-invite/${inviteLink}`)}`}
                  alt="QR Code do convite"
                  className="mx-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
