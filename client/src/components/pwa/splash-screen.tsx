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
  const [shouldFadeOut, setShouldFadeOut] = useState(false);

  useEffect(() => {
    // Start fadeout animation before completely removing
    const fadeTimer = setTimeout(() => {
      setShouldFadeOut(true);
    }, minDisplayTime - 500); // Start fade out 500ms before removing

    // Remove the component after the minimum display time
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinished) onFinished();
    }, minDisplayTime);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [minDisplayTime, onFinished]);

  // If not visible, return null to not render anything
  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-primary ${shouldFadeOut ? 'splash-fadeout' : ''}`}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <img 
          src="/logo-white.png" 
          alt="Por Nós" 
          className="w-64 h-auto mb-8 animate-logo-pulse"
        />
        
        <p className="text-white text-lg font-medium mb-8">
          Todo dia é uma nova chance de nos escolher
        </p>
        
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-white mr-2 animate-pulse" />
            <Heart className="w-8 h-8 text-white animate-pulse" fill="white" />
          </div>
          
          <div className="heart-spinner w-8 h-8 mt-2"></div>
        </div>
      </div>
    </div>
  );
}