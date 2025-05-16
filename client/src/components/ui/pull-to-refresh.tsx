import { useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { Loader2, ChevronDown } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  loadingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  loadingText = "Atualizando...",
  pullText = "Puxe para atualizar",
  releaseText = "Solte para atualizar",
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);
  const pullDistance = useRef(0);
  const hasMoved = useRef(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const MAX_PULL_DISTANCE = 120;
  const ACTIVATION_THRESHOLD = MAX_PULL_DISTANCE * 0.6;
  const MOVEMENT_THRESHOLD = 10; // Mínimo de pixels para considerar como um movimento de puxar

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      pullDistance.current = 0;
      hasMoved.current = false;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || refreshing) return;

    const previousY = currentY.current;
    currentY.current = e.touches[0].clientY;

    // Calcular a distância do movimento atual
    const moveDistance = currentY.current - previousY;

    // Verificar se o usuário realmente está puxando para baixo
    if (currentY.current - startY.current > MOVEMENT_THRESHOLD) {
      hasMoved.current = true;

      pullDistance.current = Math.max(
        0,
        Math.min(currentY.current - startY.current, MAX_PULL_DISTANCE)
      );

      // Calcular progresso percentual
      const progress = (pullDistance.current / ACTIVATION_THRESHOLD) * 100;
      setPullProgress(Math.min(progress, 100));

      if (pullDistance.current > 0) {
        // Prevenir o comportamento padrão apenas quando estamos realmente puxando
        if (moveDistance > 0 && containerRef.current?.scrollTop === 0) {
          e.preventDefault();
        }

        // Aplicar fator de resistência para uma sensação mais natural
        const resistanceFactor =
          0.5 + 0.5 * Math.exp(-pullDistance.current / 50);
        const adjustedDistance = pullDistance.current * resistanceFactor;

        controls.set({
          y: adjustedDistance,
          opacity: Math.min(
            pullDistance.current / (MAX_PULL_DISTANCE * 0.5),
            1
          ),
          rotate: pullDistance.current > ACTIVATION_THRESHOLD ? [0, 180] : 0,
        });
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || refreshing) return;

    // Verificar se o usuário realmente puxou (não apenas tocou)
    if (hasMoved.current && pullDistance.current >= ACTIVATION_THRESHOLD) {
      setRefreshing(true);
      setPullProgress(100);

      // Animar para o estado de carregamento
      await controls.start({
        y: 50,
        opacity: 1,
        rotate: 0,
        transition: { type: "spring", stiffness: 400, damping: 30 },
      });

      try {
        await onRefresh();
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      } finally {
        setRefreshing(false);
        setPullProgress(0);
      }
    }

    // Retornar ao estado inicial com animação spring
    await controls.start({
      y: 0,
      opacity: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    });

    setIsPulling(false);
    hasMoved.current = false;
    pullDistance.current = 0;
  };

  return (
    <div
      className="flex-1 overflow-y-auto relative"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        className="absolute top-50 left-0 right-0 flex flex-col items-center z-10 pointer-events-none"
        animate={controls}
        initial={{ y: 0, opacity: 0 }}
      >
        <div className="bg-primary-light/20 backdrop-blur-sm rounded-full mt-2 shadow-sm">
          {refreshing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <motion.div
              animate={{ rotate: pullProgress >= 100 ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ChevronDown className="h-6 w-6 text-primary" />
            </motion.div>
          )}
        </div>

        {/* Progress indicator */}
        {isPulling && hasMoved.current && !refreshing && pullProgress > 10 && (
          <div className="mt-2 text-xs font-medium text-primary bg-primary-light/30 px-3 py-1 rounded-full">
            {pullProgress >= 100 ? releaseText : pullText}
          </div>
        )}

        {refreshing && (
          <div className="mt-2 text-xs font-medium text-primary bg-primary-light/30 px-3 py-1 rounded-full">
            {loadingText}
          </div>
        )}
      </motion.div>

      {/* Overlay for visual feedback during pull */}
      {isPulling && hasMoved.current && pullProgress > 5 && (
        <motion.div
          className="absolute inset-0 bg-primary-light/5 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: pullProgress / 200 }}
        />
      )}

      {children}
    </div>
  );
}
