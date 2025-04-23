import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type SplashScreenContextType = {
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  appIsReady: boolean;
};

// Create context with default values
const SplashScreenContext = createContext<SplashScreenContextType>({
  isLoading: true,
  setIsLoading: () => {},
  appIsReady: false,
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
  const [appIsReady, setAppIsReady] = useState(false);

  // Set app as ready after initial load
  useEffect(() => {
    // Simulate checking if assets/data are loaded
    const timer = setTimeout(() => {
      setAppIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SplashScreenContext.Provider
      value={{
        isLoading,
        setIsLoading,
        appIsReady,
      }}
    >
      {children}
    </SplashScreenContext.Provider>
  );
}

// Custom hook to use the splash screen context
export function useSplashScreen() {
  const context = useContext(SplashScreenContext);
  
  if (!context) {
    throw new Error("useSplashScreen must be used within a SplashScreenProvider");
  }
  
  return context;
}