import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { NotificationIndicator } from "./notification-indicator";
import { InvitePartnerModal } from "../partner/invite-partner-modal";
import { useAuth } from "@/hooks/use-auth";

interface BottomNavigationProps {
  onCreateEvent?: () => void;
}

export default function BottomNavigation({
  onCreateEvent,
}: BottomNavigationProps) {
  const [location] = useLocation();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const { user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };
  
  const handleCreateClick = () => {
    if (onCreateEvent) {
      onCreateEvent();
    } else {
      setIsCreateMenuOpen(!isCreateMenuOpen);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-5">
      <div className="flex items-center justify-around h-16 px-4">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-12 h-12 ${
            isActive("/") ? "text-primary" : "text-gray-600"
          }`}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs mt-1">Agenda</span>
        </Link>

        <div className="relative">
          <Button
            onClick={handleCreateClick}
            className="h-14 w-14 rounded-full bg-primary hover:bg-primary-dark text-white shadow-lg flex items-center justify-center"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>
        
        <Link
          to="/tasks"
          className={`flex flex-col items-center justify-center w-12 h-12 ${
            isActive("/tasks") ? "text-primary" : "text-gray-600"
          }`}
        >
          <span className="material-icons text-[22px]">task_alt</span>
          <span className="text-xs mt-1">Tarefas</span>
        </Link>

        {/* Botão de convite para conectar parceiro */}
        {user && !user.partnerId && (
          <InvitePartnerModal>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="flex flex-col items-center justify-center w-12 h-12 cursor-pointer text-gray-600 hover:text-primary"
            >
              <div className="relative">
                <Heart className="h-6 w-6 text-pink-500" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    repeatType: "loop" 
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                />
              </div>
              <span className="text-xs mt-1">Convite</span>
            </motion.div>
          </InvitePartnerModal>
        )}
      </div>
    </div>
  );
}
