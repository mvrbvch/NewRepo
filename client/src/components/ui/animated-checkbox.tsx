import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef } from "react";

// Define o tipo de props baseado nas propriedades internas do componente Checkbox
type BaseCheckboxProps = ComponentPropsWithoutRef<typeof Checkbox>;

interface AnimatedCheckboxProps extends BaseCheckboxProps {
  size?: "sm" | "md" | "lg";
  shape?: "square" | "rounded" | "circle";
  color?: string;
  strokeWidth?: number;
  animationDuration?: number;
  rippleEffect?: boolean;
}

export function AnimatedCheckbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  value,
  id,
  size = "md",
  shape = "rounded",
  color = "var(--primary)",
  strokeWidth = 2.5,
  animationDuration = 0.3,
  rippleEffect = true,
  className,
  ...props
}: AnimatedCheckboxProps) {
  // Determinar tamanho baseado na prop size
  const getSize = () => {
    switch (size) {
      case "sm": return "h-4 w-4 min-w-4";
      case "lg": return "h-6 w-6 min-w-6";
      default: return "h-5 w-5 min-w-5";
    }
  };
  
  // Determinar o arredondamento baseado na prop shape
  const getShape = () => {
    switch (shape) {
      case "square": return "rounded-none";
      case "circle": return "rounded-full";
      default: return "rounded-sm";
    }
  };
  
  // Definindo as variantes de animação para o ripple effect
  const rippleVariants = {
    unchecked: {
      scale: 0,
      opacity: 0
    },
    checked: {
      scale: 1.5,
      opacity: 0,
      transition: {
        duration: animationDuration * 1.5,
        ease: "easeOut"
      }
    }
  };
  
  // Variantes para o movimento do ícone de check
  const checkVariants = {
    unchecked: {
      pathLength: 0, 
      opacity: 0
    },
    checked: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: animationDuration,
        ease: "easeOut"
      }
    }
  };
  
  // Combinação das classes
  const checkboxClasses = cn(
    getSize(),
    getShape(),
    "transition-all flex items-center justify-center",
    disabled && "opacity-50 cursor-not-allowed", 
    className
  );
  
  return (
    <div className="relative">
      <Checkbox
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        id={id}
        className={checkboxClasses}
        {...props}
      >
        {/* Componente de Check personalizado animado */}
        {(checked || defaultChecked) && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial="unchecked"
            animate="checked"
            exit="unchecked"
          >
            <motion.div className="h-full w-full">
              <motion.svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="h-full w-full"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  variants={checkVariants}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </motion.div>
          </motion.div>
        )}
      </Checkbox>
      
      {/* Efeito de ripple ao clicar - opcional */}
      {rippleEffect && (
        <motion.div
          className="absolute -inset-1 rounded-full pointer-events-none"
          style={{ backgroundColor: color, opacity: 0.15 }}
          initial="unchecked"
          animate={checked ? "checked" : "unchecked"}
          variants={rippleVariants}
        />
      )}
    </div>
  );
}