import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "success" | "error" | "info" | "warning";

interface AnimatedNotificationProps {
  type?: NotificationType;
  message: string;
  description?: string;
  duration?: number;
  show: boolean;
  onClose?: () => void;
  className?: string;
}

export function AnimatedNotification({
  type = "info",
  message,
  description,
  duration = 3000,
  show,
  onClose,
  className,
}: AnimatedNotificationProps) {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
    
    let timer: NodeJS.Timeout;
    if (show && duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
    }
    
    return () => clearTimeout(timer);
  }, [show, duration, onClose]);

  // Mapear tipo para ícone e cor
  const iconMap: Record<NotificationType, ReactNode> = {
    success: <Check className="h-5 w-5" />,
    error: <X className="h-5 w-5" />,
    warning: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  const colorMap: Record<NotificationType, string> = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  const iconColorMap: Record<NotificationType, string> = {
    success: "bg-green-100 text-green-600",
    error: "bg-red-100 text-red-600",
    warning: "bg-yellow-100 text-yellow-600", 
    info: "bg-blue-100 text-blue-600",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "rounded-lg border p-4 shadow-sm",
            colorMap[type],
            className
          )}
        >
          <div className="flex items-start">
            <div 
              className={cn(
                "mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                iconColorMap[type]
              )}
            >
              {iconMap[type]}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium">{message}</h3>
              {description && (
                <div className="mt-1 text-sm opacity-90">{description}</div>
              )}
            </div>
            <button
              type="button"
              className="ml-3 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => {
                setIsVisible(false);
                if (onClose) onClose();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}