import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Mail, Phone, Share2, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InvitePartnerModalProps {
  children: React.ReactNode;
}

export function InvitePartnerModal({ children }: InvitePartnerModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail("");
    setPhoneNumber("");
    setInviteLink("");
    setCopied(false);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(resetForm, 300);
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "Compartilhe este link com seu parceiro.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link automaticamente.",
        variant: "destructive",
      });
    }
  };

  const sendInvite = async (method: "email" | "phone") => {
    setLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/partner/invite", {
        email: method === "email" ? email : undefined,
        phoneNumber: method === "phone" ? phoneNumber : undefined,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao enviar convite");
      }
      
      const data = await response.json();
      
      // Construir o link completo para convite
      const baseUrl = window.location.origin;
      const fullInviteLink = `${baseUrl}/accept-invite?token=${data.inviteToken}`;
      setInviteLink(fullInviteLink);
      
      toast({
        title: "Convite enviado!",
        description: method === "email" 
          ? "Enviamos um email com o link de convite." 
          : "Convite criado com sucesso. Compartilhe o link gerado.",
      });
    } catch (error) {
      console.error("Erro ao enviar convite:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convide seu Parceiro</DialogTitle>
          <DialogDescription>
            Conecte-se com seu parceiro para compartilhar calendários, tarefas e mais.
          </DialogDescription>
        </DialogHeader>
        
        {inviteLink ? (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Heart className="h-4 w-4 mr-2 text-pink-500" />
                Link de convite gerado com sucesso!
              </h3>
              <div className="bg-background p-2 rounded border flex items-center">
                <p className="text-sm truncate flex-1">{inviteLink}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyToClipboard}
                  className="ml-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={resetForm}
              >
                Criar novo convite
              </Button>
              <Button
                onClick={handleClose}
              >
                Concluído
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="h-4 w-4 mr-2" />
                Telefone
              </TabsTrigger>
              <TabsTrigger value="direct">
                <Share2 className="h-4 w-4 mr-2" />
                Direto
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do parceiro</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parceiro@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => sendInvite("email")}
                  disabled={!email || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>Enviar Convite</>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="phone" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone do parceiro</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => sendInvite("phone")}
                  disabled={!phoneNumber || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>Gerar Link</>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="direct" className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Gere um link único para compartilhar diretamente com seu parceiro por qualquer meio.
                </p>
              </div>
              <DialogFooter>
                <Button 
                  onClick={() => sendInvite("email")}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>Gerar Link</>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}