import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { TactileFeedback } from "@/components/ui/tactile-feedback";

// Interface para as notificações
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationIndicatorProps {
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function NotificationIndicator({
  className = "",
  showLabel = true,
  size = "md",
}: NotificationIndicatorProps) {
  // Buscar notificações do usuário
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000, // Considerar dados obsoletos após 10 segundos
  });

  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calcular o tamanho do ícone com base na prop size
  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "h-5 w-5";
      case "lg":
        return "h-7 w-7";
      default:
        return "h-6 w-6";
    }
  };

  // Calcular o tamanho do badge com base na prop size
  const getBadgeSize = () => {
    switch (size) {
      case "sm":
        return "min-w-[16px] h-[16px] text-[10px]";
      case "lg":
        return "min-w-[22px] h-[22px] text-xs";
      default:
        return "min-w-[18px] h-[18px] text-xs";
    }
  };

  // Calcular a posição do badge com base na prop size
  const getBadgePosition = () => {
    switch (size) {
      case "sm":
        return "-top-1 -right-1";
      case "lg":
        return "-top-1.5 -right-1.5";
      default:
        return "-top-1 -right-1";
    }
  };

  // Efeito para contar notificações não lidas e animar quando chegam novas
  useEffect(() => {
    // Contar notificações não lidas
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Se o contador aumentou, ativar animação
    if (unreadCount > count && count > 0) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }

    setCount(unreadCount);
    setHasNewNotifications(unreadCount > 0);
  }, [notifications, count]);

  return (
    <Link
      to="/notifications"
      className={`relative flex flex-col items-center ${className}`}
      aria-label={`Notificações${count > 0 ? ` (${count} não lidas)` : ""}`}
    >
      <TactileFeedback>
        <div className="relative">
          <motion.div
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Bell
              className={`${getIconSize()} ${hasNewNotifications ? "text-white/70" : "text-white"}`}
            />
          </motion.div>

          <AnimatePresence>
            {hasNewNotifications && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute ${getBadgePosition()}`}
              >
                <Badge
                  className={`bg-primary text-white px-1 flex items-center justify-center rounded-full ${getBadgeSize()}`}
                >
                  {count > 99 ? "99+" : count}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {showLabel && (
          <span
            className={`text-xs mt-1 ${hasNewNotifications ? "text-primary font-medium" : "text-gray-600"}`}
          >
            Notificações
          </span>
        )}
      </TactileFeedback>
    </Link>
  );
}
