import React, { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Componente de contêiner de página que envolve o conteúdo da página
 * com estilos consistentes.
 */
export function PageContainer({ children, className = "" }: PageContainerProps) {
  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {children}
    </div>
  );
}