import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import NotificationButton from "./notification-button";

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
  const { subscriptionStatus } = usePushNotifications();
  
  return (
    <div className="bg-white border-t border-gray-200 flex items-center justify-around p-2 z-10 shadow-sm">
      <Link href="/">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/' ? 'text-primary-dark font-medium' : 'text-dark'
          }`}
          asChild
        >
          <a>
            <span className="material-icons text-[22px]">calendar_today</span>
            <span className="text-xs mt-1">Calendário</span>
          </a>
        </Button>
      </Link>
      
      <div className="flex flex-col items-center">
        <NotificationButton 
          variant="ghost"
          size="default"
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/notifications' ? 'text-primary-dark' : 'text-dark'
          }`}
        />
        <span className="text-xs mt-1 text-medium font-medium">Notificações</span>
      </div>
      
      <div className="relative flex justify-center">
        <Button 
          className="absolute -top-6 bg-gradient-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
          onClick={onCreateEvent}
        >
          <span className="material-icons">add</span>
        </Button>
      </div>
      
      <Link href="/tasks">
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/tasks' ? 'text-primary-dark font-medium' : 'text-dark'
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
