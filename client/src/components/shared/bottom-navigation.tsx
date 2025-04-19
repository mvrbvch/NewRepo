import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface BottomNavigationProps {
  onCreateEvent: () => void;
  onNotificationsClick?: () => void;
}

export default function BottomNavigation({ 
  onCreateEvent, 
  onNotificationsClick 
}: BottomNavigationProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="bg-white border-t flex items-center justify-around p-2 z-10">
      <Link href="/">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/' ? 'text-primary' : 'text-gray-500'
          }`}
          asChild
        >
          <a>
            <span className="material-icons text-[22px]">calendar_today</span>
            <span className="text-xs mt-1">Calendário</span>
          </a>
        </Button>
      </Link>
      
      <Link href="/notifications">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/notifications' ? 'text-primary' : 'text-gray-500'
          }`}
          asChild
          onClick={() => onNotificationsClick?.()}
        >
          <a>
            <span className="material-icons text-[22px]">notifications</span>
            <span className="text-xs mt-1">Notificações</span>
          </a>
        </Button>
      </Link>
      
      <div className="relative flex justify-center">
        <Button 
          className="absolute -top-6 bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          onClick={onCreateEvent}
        >
          <span className="material-icons">add</span>
        </Button>
      </div>
      
      <Link href="/tasks">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/tasks' ? 'text-primary' : 'text-gray-500'
          }`}
          asChild
        >
          <a>
            <span className="material-icons text-[22px]">task_alt</span>
            <span className="text-xs mt-1">Tarefas</span>
          </a>
        </Button>
      </Link>
    </div>
  );
}
