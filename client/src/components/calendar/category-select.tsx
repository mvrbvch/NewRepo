import { useState, useEffect } from "react";
import { EventCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Tag, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TactileFeedback } from "@/components/ui/tactile-feedback";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Cores pré-definidas para categorias
export const categoryColors = [
  "#ef4444", // Vermelho
  "#f97316", // Laranja
  "#f59e0b", // Âmbar 
  "#84cc16", // Verde-limão
  "#10b981", // Esmeralda
  "#06b6d4", // Ciano
  "#3b82f6", // Azul
  "#8b5cf6", // Violeta
  "#d946ef", // Fúcsia
  "#ec4899", // Rosa
  "#64748b", // Cinza azulado
];

interface CategorySelectProps {
  selectedCategoryId?: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onCategoryCreate?: (category: EventCategory) => void;
  color?: string | null;
  onColorChange?: (color: string | null) => void;
}

export default function CategorySelect({
  selectedCategoryId,
  onCategoryChange,
  onCategoryCreate,
  color,
  onColorChange
}: CategorySelectProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<EventCategory | null>(null);
  
  // Estado para um novo categoria
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: categoryColors[0],
    icon: "🏷️"
  });
  
  // Carregar categorias
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/event-categories"],
    queryFn: async () => {
      const response = await fetch("/api/event-categories");
      if (!response.ok) throw new Error("Falha ao carregar categorias");
      return response.json();
    }
  });
  
  // Criar categoria
  const createMutation = useMutation({
    mutationFn: async (category: Omit<EventCategory, "id" | "userId" | "isShared">) => {
      return apiRequest("/api/event-categories", "POST", JSON.stringify(category));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-categories"] });
      setNewCategory({ name: "", color: categoryColors[0], icon: "🏷️" });
      setIsCreateOpen(false);
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Atualizar categoria
  const updateMutation = useMutation({
    mutationFn: async (category: Partial<EventCategory>) => {
      return apiRequest(`/api/event-categories/${category.id}`, {
        method: "PATCH",
        body: JSON.stringify(category)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-categories"] });
      setEditCategory(null);
      toast({
        title: "Categoria atualizada",
        description: "A categoria foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  // Excluir categoria
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/event-categories/${id}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-categories"] });
      setEditCategory(null);
      toast({
        title: "Categoria excluída",
        description: "A categoria foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  });
  
  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a categoria.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(newCategory);
  };
  
  const handleUpdateCategory = () => {
    if (!editCategory) return;
    
    if (!editCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para a categoria.",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate(editCategory);
  };
  
  const handleDeleteCategory = () => {
    if (!editCategory) return;
    
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${editCategory.name}"?`)) {
      deleteMutation.mutate(editCategory.id);
    }
  };
  
  // Encontrar a categoria selecionada
  const selectedCategory = categories.find((cat: EventCategory) => cat.id === selectedCategoryId);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={selectedCategoryId?.toString() || ""}
            onValueChange={(value) => onCategoryChange(value ? parseInt(value, 10) : null)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria">
                {selectedCategory ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedCategory.color }}></span>
                    <span>{selectedCategory.icon} {selectedCategory.name}</span>
                  </div>
                ) : "Selecione uma categoria"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-gray-300"></span>
                  <span>Sem categoria</span>
                </div>
              </SelectItem>
              
              {categories.map((category: EventCategory) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}></span>
                    <span>{category.icon} {category.name}</span>
                  </div>
                </SelectItem>
              ))}
              
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => setIsCreateOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  <span>Criar nova categoria</span>
                </Button>
              </div>
            </SelectContent>
          </Select>
        </div>
        
        {selectedCategory && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditCategory(selectedCategory)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Seleção de cor personalizada, se nenhuma categoria selecionada */}
      {!selectedCategoryId && onColorChange && (
        <div className="mt-2">
          <Label>Cor do evento</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              type="button"
              className={`h-6 w-6 rounded-full border-2 ${!color ? 'border-primary' : 'border-transparent'}`}
              onClick={() => onColorChange(null)}
            >
              <span className="h-5 w-5 rounded-full block m-auto bg-gray-300"></span>
            </button>
            
            {categoryColors.map((colorOption) => (
              <button
                key={colorOption}
                type="button"
                className={`h-6 w-6 rounded-full border-2 ${color === colorOption ? 'border-primary' : 'border-transparent'}`}
                style={{ backgroundColor: colorOption }}
                onClick={() => onColorChange(colorOption)}
              ></button>
            ))}
          </div>
        </div>
      )}
      
      {/* Dialog para criar categoria */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar nova categoria</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Nome da categoria</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Ex: Trabalho, Família, Saúde..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoryIcon">Ícone</Label>
              <Input
                id="categoryIcon"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                placeholder="Emoji ou ícone"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {categoryColors.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${newCategory.color === colorOption ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: colorOption }}
                    onClick={() => setNewCategory({...newCategory, color: colorOption})}
                  ></button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateCategory} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar categoria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para editar categoria */}
      <Dialog open={!!editCategory} onOpenChange={(open) => !open && setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
          </DialogHeader>
          
          {editCategory && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editCategoryName">Nome da categoria</Label>
                <Input
                  id="editCategoryName"
                  value={editCategory.name}
                  onChange={(e) => setEditCategory({...editCategory, name: e.target.value})}
                  placeholder="Ex: Trabalho, Família, Saúde..."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCategoryIcon">Ícone</Label>
                <Input
                  id="editCategoryIcon"
                  value={editCategory.icon || ""}
                  onChange={(e) => setEditCategory({...editCategory, icon: e.target.value})}
                  placeholder="Emoji ou ícone"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryColors.map((colorOption) => (
                    <button
                      key={colorOption}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 ${editCategory.color === colorOption ? 'border-primary' : 'border-transparent'}`}
                      style={{ backgroundColor: colorOption }}
                      onClick={() => setEditCategory({...editCategory, color: colorOption})}
                    ></button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteCategory} 
                  disabled={deleteMutation.isPending}
                  className="w-full"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir categoria"}
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCategory(null)}>Cancelar</Button>
            <Button onClick={handleUpdateCategory} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}