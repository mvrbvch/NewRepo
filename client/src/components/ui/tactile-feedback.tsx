import { useEffect, useState, useCallback } from 'react';

interface TactileFeedbackOptions {
  /**
   * Padrão de vibração em milissegundos.
   * Ex: [100, 50, 200] = vibrar 100ms, pausa 50ms, vibrar 200ms
   */
  pattern?: number | number[];
  
  /**
   * Intervalo mínimo entre acionamentos consecutivos em milissegundos.
   * Evita spam de vibrações.
   */
  throttleMs?: number;
  
  /**
   * Se verdadeiro, ativa automaticamente na montagem do componente
   */
  autoTrigger?: boolean;
  
  /**
   * Tipo de feedback: 'success', 'error', 'warning', etc.
   * Cada tipo tem um padrão de vibração predefinido
   */
  type?: 'success' | 'error' | 'warning' | 'tap' | 'notification' | 'custom';
}

/**
 * Feedback tátil component usando a API de vibração
 * 
 * Exemplo de uso:
 * ```jsx
 * <TactileFeedback type="success" />
 * ```
 * 
 * ou com acionamento manual:
 * ```jsx
 * const feedbackRef = useRef<TactileFeedbackHandle>(null);
 * ...
 * <button onClick={() => feedbackRef.current.trigger()}>
 *   Vibrar
 * </button>
 * <TactileFeedback ref={feedbackRef} type="success" />
 * ```
 */
export default function TactileFeedback({
  pattern,
  throttleMs = 300,
  autoTrigger = false,
  type = 'tap'
}: TactileFeedbackOptions) {
  const [lastTriggerTime, setLastTriggerTime] = useState(0);
  
  // Definir padrões de vibração para diferentes tipos de feedback
  const getPattern = useCallback(() => {
    if (pattern) return pattern;
    
    switch (type) {
      case 'success':
        return [15, 50, 50]; // Vibração breve seguida de uma pausa e outra vibração curta
      case 'error':
        return [60, 50, 60, 50, 60]; // Três vibrações rápidas
      case 'warning':
        return [40, 30, 80]; // Vibração curta + vibração longa
      case 'notification':
        return [20, 50, 50, 50, 20]; // Padrão de notificação
      case 'tap':
      default:
        return 15; // Vibração simples e curta
    }
  }, [pattern, type]);
  
  const trigger = useCallback(() => {
    // Verificar se o navegador suporta vibração
    if (!navigator.vibrate) {
      console.warn('Vibration API não suportada neste dispositivo');
      return false;
    }
    
    const now = Date.now();
    
    // Prevenir acionamentos muito frequentes (throttling)
    if (now - lastTriggerTime < throttleMs) {
      return false;
    }
    
    setLastTriggerTime(now);
    
    try {
      // Acionar vibração
      const vibrationPattern = getPattern();
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (err) {
      console.error('Erro ao acionar vibração:', err);
      return false;
    }
  }, [getPattern, lastTriggerTime, throttleMs]);
  
  // Acionar automaticamente na montagem se autoTrigger=true
  useEffect(() => {
    if (autoTrigger) {
      trigger();
    }
  }, [autoTrigger, trigger]);
  
  // Componente não renderiza nada visualmente
  return null;
}

// Hook personalizado para usar feedback tátil em qualquer componente
export function useTactileFeedback(options: TactileFeedbackOptions = {}) {
  const [lastTriggerTime, setLastTriggerTime] = useState(0);
  
  const getPattern = useCallback(() => {
    if (options.pattern) return options.pattern;
    
    switch (options.type) {
      case 'success':
        return [15, 50, 50];
      case 'error':
        return [60, 50, 60, 50, 60];
      case 'warning':
        return [40, 30, 80];
      case 'notification':
        return [20, 50, 50, 50, 20];
      case 'tap':
      default:
        return 15;
    }
  }, [options.pattern, options.type]);
  
  const trigger = useCallback(() => {
    // Verificar se o navegador suporta vibração
    if (!navigator.vibrate) {
      return false;
    }
    
    const now = Date.now();
    const throttleMs = options.throttleMs || 300;
    
    // Prevenir acionamentos muito frequentes
    if (now - lastTriggerTime < throttleMs) {
      return false;
    }
    
    setLastTriggerTime(now);
    
    try {
      const vibrationPattern = getPattern();
      navigator.vibrate(vibrationPattern);
      return true;
    } catch (err) {
      console.error('Erro ao acionar vibração:', err);
      return false;
    }
  }, [getPattern, lastTriggerTime, options.throttleMs]);
  
  return { trigger };
}