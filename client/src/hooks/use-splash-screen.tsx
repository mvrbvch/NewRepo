import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Simplified SplashScreenContext
type SplashScreenContextType = {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
};

// Create context with default values
export const SplashScreenContext = createContext<SplashScreenContextType>({
  isLoading: true,
  setIsLoading: () => {},
});

interface SplashScreenProviderProps {
  children: ReactNode;
  initialLoadingState?: boolean;
}

export function SplashScreenProvider({
  children,
  initialLoadingState = true,
}: SplashScreenProviderProps) {
  const [isLoading, setIsLoading] = useState(initialLoadingState);
  
  // Set app as ready after initial load
  useEffect(() => {
    // This will automatically close the splash screen after a delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SplashScreenContext.Provider
      value={{
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </SplashScreenContext.Provider>
  );
}

// Custom hook to use the splash screen context
export function useSplashScreen() {
  const context = useContext(SplashScreenContext);
  
  if (context === undefined) {
    throw new Error("useSplashScreen must be used within a SplashScreenProvider");
  }
  
  return context;
}