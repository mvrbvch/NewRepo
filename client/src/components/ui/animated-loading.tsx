import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedLoadingProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
  message?: string;
}

export function AnimatedLoading({
  size = "md",
  color = "primary",
  className,
  message,
}: AnimatedLoadingProps) {
  // Configurar tamanho com base na prop
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  // Configurar cores com base na prop
  const colorClasses = {
    primary: "text-primary",
    secondary: "text-gray-500",
    white: "text-white",
  };

  // Animação das bolinhas
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.2,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const circleVariants = {
    start: {
      y: "0%",
    },
    end: {
      y: "100%",
    },
  };

  const circleTransition = {
    duration: 0.5,
    yoyo: Infinity,
    ease: "easeInOut",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <motion.div
        className="flex space-x-2"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className={cn(
              "block rounded-full bg-current",
              sizeClasses[size],
              colorClasses[color as keyof typeof colorClasses] || "text-primary"
            )}
            variants={circleVariants}
            transition={{
              ...circleTransition,
              delay: index * 0.1,
            }}
          />
        ))}
      </motion.div>
      
      {message && (
        <p className="mt-3 text-center text-sm font-medium text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}