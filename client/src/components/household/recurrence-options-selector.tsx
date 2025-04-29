import { useState, useEffect } from "react";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface RecurrenceOptionsProps {
  frequency: string;
  weekdays?: number[];
  monthDay?: number;
  endDate?: Date | null;
  timezone?: string;
}

interface RecurrenceOptionsSelectorProps {
  options: RecurrenceOptionsProps;
  onChange: (options: RecurrenceOptionsProps) => void;
}

const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

export default function RecurrenceOptionsSelector({ options, onChange }: RecurrenceOptionsSelectorProps) {
  // Estado local
  const [localOptions, setLocalOptions] = useState<RecurrenceOptionsProps>(options);

  // Atualizar estado local quando as opções externas mudam
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Função para atualizar as opções e propagar a mudança
  const updateOptions = (newValues: Partial<RecurrenceOptionsProps>) => {
    const updatedOptions = { ...localOptions, ...newValues };
    setLocalOptions(updatedOptions);
    onChange(updatedOptions);
  };

  // Handler para seleção de dias da semana
  const handleWeekdaysChange = (values: string[]) => {
    const weekdays = values.map(v => parseInt(v, 10));
    updateOptions({ weekdays });
  };

  // Handler para seleção do dia do mês
  const handleMonthDayChange = (day: string) => {
    updateOptions({ monthDay: parseInt(day, 10) });
  };

  // Handler para seleção da data de término
  const handleEndDateChange = (date: Date | null) => {
    updateOptions({ endDate: date });
  };

  // Renderização baseada na frequência selecionada
  const renderFrequencyOptions = () => {
    switch (localOptions.frequency) {
      case "weekly":
      case "biweekly":
        return (
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Dias da semana</FormLabel>
              <FormControl>
                <ToggleGroup
                  type="multiple"
                  value={localOptions.weekdays?.map(d => d.toString()) || []}
                  onValueChange={handleWeekdaysChange}
                  className="flex flex-wrap gap-1"
                >
                  {weekdayNames.map((name, index) => (
                    <ToggleGroupItem
                      key={index}
                      value={index.toString()}
                      className="w-10 h-10 rounded-full"
                    >
                      {name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormDescription>
                Selecione os dias da semana em que esta tarefa deve ocorrer.
              </FormDescription>
            </FormItem>
          </div>
        );

      case "monthly":
        return (
          <div className="space-y-4">
            <FormItem>
              <FormLabel>Dia do mês</FormLabel>
              <Select
                value={localOptions.monthDay?.toString() || "1"}
                onValueChange={handleMonthDayChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o dia do mês" />
                </SelectTrigger>
                <SelectContent>
                  {monthDays.map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      Dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Escolha o dia do mês em que esta tarefa deve ocorrer.
              </FormDescription>
            </FormItem>
          </div>
        );

      default:
        return null;
    }
  };

  // Opção de data de término para todas as frequências
  const renderEndDateOption = () => {
    return (
      <div className="mt-4">
        <FormItem>
          <FormLabel>Data de término (opcional)</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !localOptions.endDate && "text-muted-foreground"
                  )}
                >
                  {localOptions.endDate ? (
                    format(localOptions.endDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Sem data de término</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localOptions.endDate || undefined}
                onSelect={handleEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormDescription>
            Defina uma data de término para a recorrência desta tarefa, se desejar.
          </FormDescription>
        </FormItem>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderFrequencyOptions()}
      {localOptions.frequency !== "once" && localOptions.frequency !== "never" && (
        renderEndDateOption()
      )}
    </div>
  );
}