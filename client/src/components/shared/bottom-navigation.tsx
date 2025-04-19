import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface BottomNavigationProps {
  onCreateEvent: () => void;
}

export default function BottomNavigation({ onCreateEvent }: BottomNavigationProps) {
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
      
      <Link href={user?.partnerId ? "/" : "/invite-partner"}>
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center py-1 px-3 h-auto ${
            location === '/invite-partner' ? 'text-primary' : 'text-gray-500'
          }`}
          asChild
        >
          <a>
            <span className="material-icons text-[22px]">people</span>
            <span className="text-xs mt-1">Compartilhar</span>
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
      
      <Button 
        variant="ghost" 
        className="flex flex-col items-center py-1 px-3 h-auto text-gray-500"
        disabled
      >
        <span className="material-icons text-[22px]">chat</span>
        <span className="text-xs mt-1">Mensagens</span>
      </Button>
      
      <Button 
        variant="ghost" 
        className="flex flex-col items-center py-1 px-3 h-auto text-gray-500"
        disabled
      >
        <span className="material-icons text-[22px]">settings</span>
        <span className="text-xs mt-1">Ajustes</span>
      </Button>
    </div>
  );
}
