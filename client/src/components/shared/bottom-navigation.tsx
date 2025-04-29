import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Home,
  Calendar,
  User,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { NotificationIndicator } from "./notification-indicator";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  onCreateEvent?: () => void;
}

export default function BottomNavigation({
  onCreateEvent,
}: BottomNavigationProps) {
  const [location] = useLocation();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

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
          to="/calendar"
          className={`flex flex-col items-center justify-center w-12 h-12 ${
            isActive("/calendar") ? "text-primary" : "text-gray-600"
          }`}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-xs mt-1">Agenda</span>
        </Link>

        <Link
          to="/insights"
          className={`flex flex-col items-center justify-center w-12 h-12 ${
            isActive("/insights") ? "text-primary" : "text-gray-600"
          }`}
        >
          <Sparkles className="h-6 w-6" />
          <span className="text-xs mt-1">Insights</span>
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

        <Link
          to="#"
          className={`flex flex-col items-center justify-center w-25 h-12 disabled pointer-events-none text-gray-300`}
        >
          <span className="material-icons text-[22px]">book</span>
          <Badge variant="secondary" className={"text-xs font-normal"}>
            Notas
          </Badge>
        </Link>
      </div>
    </div>
  );
}
