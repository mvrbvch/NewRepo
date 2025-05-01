import { Loader2, Heart, Trash, HeartOff, MessageCircle } from "lucide-react";
import { useRelationshipTips } from "@/hooks/use-relationship-tips";
import { RelationshipTipType, TipCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

interface TipListProps {
  type: "all" | "favorites";
}

export function TipList({ type }: TipListProps) {
  const { user } = useAuth();
  const {
    useUserTips,
    useFavoriteTips,
    useFavoriteTip,
    useUnfavoriteTip,
    useDeleteTip,
    useGenerateTip,
  } = useRelationshipTips();

  // Usa o hook apropriado com base no tipo
  const tipsQuery = type === "all" ? useUserTips() : useFavoriteTips();

  // Hooks para ações
  const favoriteTip = useFavoriteTip();
  const unfavoriteTip = useUnfavoriteTip();
  const deleteTip = useDeleteTip();
  const generateTip = useGenerateTip();

  const handleRefresh = () => {
    tipsQuery.refetch().catch((error) => {
      console.error("Erro ao atualizar dicas:", error);
    });
  };

  const handleGenerateTip = (category?: TipCategory) => {
    generateTip.mutate({
      partnerId: user?.partnerId || undefined,
      category,
    });
  };

  const handleFavoriteTip = (tipId: number) => {
    favoriteTip.mutate(tipId);
  };

  const handleUnfavoriteTip = (tipId: number) => {
    unfavoriteTip.mutate(tipId);
  };

  const handleDeleteTip = (tipId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta dica?")) {
      deleteTip.mutate(tipId);
    }
  };

  // Renderiza as categorias das dicas de forma amigável
  const getCategoryLabel = (category: TipCategory) => {
    const categories = {
      [TipCategory.COMMUNICATION]: "Comunicação",
      [TipCategory.QUALITY_TIME]: "Tempo de Qualidade",
      [TipCategory.CONFLICT_RESOLUTION]: "Resolução de Conflitos",
      [TipCategory.RELATIONSHIP_GROWTH]: "Crescimento do Relacionamento",
      [TipCategory.SHARED_GOALS]: "Objetivos Compartilhados",
      [TipCategory.DAILY_HABITS]: "Hábitos Diários",
    };

    return categories[category] || category;
  };

  // Badge de categoria com cores diferentes
  const CategoryBadge = ({ category }: { category: TipCategory }) => {
    const colorMap = {
      [TipCategory.COMMUNICATION]:
        "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
      [TipCategory.QUALITY_TIME]:
        "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
      [TipCategory.CONFLICT_RESOLUTION]:
        "bg-orange-100 text-orange-800 hover:bg-orange-100/80",
      [TipCategory.RELATIONSHIP_GROWTH]:
        "bg-green-100 text-green-800 hover:bg-green-100/80",
      [TipCategory.SHARED_GOALS]:
        "bg-teal-100 text-teal-800 hover:bg-teal-100/80",
      [TipCategory.DAILY_HABITS]:
        "bg-amber-100 text-amber-800 hover:bg-amber-100/80",
    };

    const className =
      colorMap[category] || "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

    return (
      <Badge variant="outline" className={className}>
        {getCategoryLabel(category)}
      </Badge>
    );
  };

  if (tipsQuery.isLoading || generateTip.isPending) {
    return (
      <div className="w-full flex justify-center items-center py-6">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-gray-500">
            {generateTip.isPending
              ? "Gerando nova dica..."
              : "Carregando dicas..."}
          </p>
        </div>
      </div>
    );
  }

  if (tipsQuery.isError) {
    return (
      <div className="w-full flex flex-col items-center py-6 gap-3">
        <p className="text-red-500 text-sm">Erro ao carregar dicas</p>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  const tips = tipsQuery.data || [];

  // Se não houver dicas, mostre uma mensagem
  if (tips.length === 0) {
    return (
      <div className="w-full flex flex-col items-center py-10 gap-4">
        <MessageCircle className="h-16 w-16 text-gray-300" />
        <p className="text-gray-500 text-center">
          {type === "all"
            ? "Você ainda não tem dicas de relacionamento"
            : "Você ainda não tem dicas favoritas"}
        </p>
        {type === "all" && (
          <Button onClick={() => handleGenerateTip()} className="mt-2">
            Gerar uma dica
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {type === "all" && (
        <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => handleGenerateTip()}
              variant="default"
              size="sm"
            >
              {generateTip.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                "Nova Dica"
              )}
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full text-sm">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          {/* <TabsTrigger value="communication">Comunicação</TabsTrigger>
          <TabsTrigger value="quality_time">Tempo de Qualidade</TabsTrigger>
          <TabsTrigger value="daily_habits">Hábitos</TabsTrigger> */}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <TipCard
                key={tip.id}
                tip={tip}
                onFavorite={handleFavoriteTip}
                onUnfavorite={handleUnfavoriteTip}
                onDelete={handleDeleteTip}
              />
            ))}
          </div>
        </TabsContent>

        {/* Filtros por categoria */}
        {Object.values(TipCategory).map((category) => (
          <TabsContent key={category} value={category} className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips
                .filter((tip) => tip.category === category)
                .map((tip) => (
                  <TipCard
                    key={tip.id}
                    tip={tip}
                    onFavorite={handleFavoriteTip}
                    onUnfavorite={handleUnfavoriteTip}
                    onDelete={handleDeleteTip}
                  />
                ))}
              {tips.filter((tip) => tip.category === category).length === 0 && (
                <div className="col-span-2 text-center py-10">
                  <p className="text-gray-500 mb-4">
                    Nenhuma dica nesta categoria
                  </p>
                  <Button
                    onClick={() => handleGenerateTip(category)}
                    variant="outline"
                  >
                    Gerar dica de {getCategoryLabel(category)}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface TipCardProps {
  tip: RelationshipTipType;
  onFavorite: (id: number) => void;
  onUnfavorite: (id: number) => void;
  onDelete: (id: number) => void;
}

function TipCard({ tip, onFavorite, onUnfavorite, onDelete }: TipCardProps) {
  const createdAt =
    typeof tip.createdAt === "string" ? new Date(tip.createdAt) : tip.createdAt;

  const formattedDate = format(createdAt, "dd 'de' MMMM", { locale: ptBR });

  return (
    <Card className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="bg-gray-50 py-3 px-4">
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-base font-semibold">{tip.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <CategoryBadge category={tip.category} />
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent className="py-4 px-4">
        <p className="text-sm text-gray-700 mb-4">{tip.content}</p>
        {tip.actionItems && tip.actionItems.length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Próximos passos:
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              {tip.actionItems.map((item, index) => (
                <li key={index} className="text-xs text-gray-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="py-2 px-4 bg-gray-50 flex justify-between">
        <div>
          {tip.saved ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUnfavorite(tip.id)}
              className="text-xs flex gap-1 text-pink-700"
            >
              <Heart size={16} fill="#be185d" className="text-pink-700" />
              Favorita
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFavorite(tip.id)}
              className="text-xs flex gap-1 text-gray-600 hover:text-pink-700"
            >
              <Heart size={16} className="text-gray-500 hover:text-pink-700" />
              Favoritar
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(tip.id)}
          className="text-xs flex gap-1 text-gray-600 hover:text-red-600"
        >
          <Trash size={16} className="text-gray-500 hover:text-red-600" />
          Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}

// Badge de categoria com cores diferentes
function CategoryBadge({ category }: { category: TipCategory }) {
  const colorMap = {
    [TipCategory.COMMUNICATION]:
      "bg-blue-100 text-blue-800 hover:bg-blue-100/80",
    [TipCategory.QUALITY_TIME]:
      "bg-purple-100 text-purple-800 hover:bg-purple-100/80",
    [TipCategory.CONFLICT_RESOLUTION]:
      "bg-orange-100 text-orange-800 hover:bg-orange-100/80",
    [TipCategory.RELATIONSHIP_GROWTH]:
      "bg-green-100 text-green-800 hover:bg-green-100/80",
    [TipCategory.SHARED_GOALS]:
      "bg-teal-100 text-teal-800 hover:bg-teal-100/80",
    [TipCategory.DAILY_HABITS]:
      "bg-amber-100 text-amber-800 hover:bg-amber-100/80",
  };

  const categoryLabels = {
    [TipCategory.COMMUNICATION]: "Comunicação",
    [TipCategory.QUALITY_TIME]: "Tempo de Qualidade",
    [TipCategory.CONFLICT_RESOLUTION]: "Resolução de Conflitos",
    [TipCategory.RELATIONSHIP_GROWTH]: "Crescimento do Relacionamento",
    [TipCategory.SHARED_GOALS]: "Objetivos Compartilhados",
    [TipCategory.DAILY_HABITS]: "Hábitos Diários",
  };

  const className =
    colorMap[category] || "bg-gray-100 text-gray-800 hover:bg-gray-100/80";

  return (
    <Badge variant="outline" className={className}>
      {categoryLabels[category] || category}
    </Badge>
  );
}
