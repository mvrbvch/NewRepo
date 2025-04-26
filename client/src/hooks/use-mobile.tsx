import { useState, useEffect } from "react";

interface UseMobileResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useMobile(): UseMobileResult {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Handler para atualizar o estado quando a janela for redimensionada
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640); // Mobile: < 640px (sm breakpoint)
      setIsTablet(width >= 640 && width < 1024); // Tablet: 640px-1024px
      setIsDesktop(width >= 1024); // Desktop: >= 1024px (lg breakpoint)
    };

    // Configurar listener para resize
    window.addEventListener("resize", handleResize);
    
    // Verificar tamanho inicial
    handleResize();

    // Cleanup do listener quando o componente desmontar
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}