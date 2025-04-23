import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface SplashScreenProps {
  minDisplayTime?: number; // Minimum time to show splash in ms
  onFinished?: () => void; // Callback when splash screen finishes
}

export function SplashScreen({ 
  minDisplayTime = 2000, 
  onFinished 
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onFinished) onFinished();
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onFinished]);

  // If not visible, return null to not render anything
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary">
      <div className="flex flex-col items-center justify-center p-6 text-center animate-float">
        <img 
          src="/logo-white.png" 
          alt="Por Nós" 
          className="w-64 h-auto mb-8"
        />
        
        <p className="text-white text-lg font-medium mb-8">
          Todo dia é uma nova chance de nos escolher
        </p>
        
        <div className="flex items-center justify-center">
          <Heart className="w-8 h-8 text-white mr-2 animate-pulse" />
          <div className="heart-spinner w-6 h-6"></div>
        </div>
      </div>
    </div>
  );
}