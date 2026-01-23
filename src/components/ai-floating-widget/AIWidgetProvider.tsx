'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { IntelligentAIWidget, AIWidgetTrigger } from './IntelligentAIWidget';
import { useAIWidget } from '@/lib/ai-components/useAIComponents';

interface AIWidgetContextValue {
  isOpen: boolean;
  showWidget: () => void;
  hideWidget: () => void;
  toggleWidget: () => void;
}

const AIWidgetContext = createContext<AIWidgetContextValue | undefined>(undefined);

interface AIWidgetProviderProps {
  children: ReactNode;
  autoInit?: boolean;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  enableShortcut?: boolean;
  shortcut?: string;
}

export function AIWidgetProvider({
  children,
  autoInit = false,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 600 },
  enableShortcut = true,
  shortcut = 'Ctrl+K'
}: AIWidgetProviderProps) {
  const { widgetState, showWidget, hideWidget, toggleWidget } = useAIWidget();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (autoInit && !isInitialized) {
      showWidget();
      setIsInitialized(true);
    }
  }, [autoInit, isInitialized, showWidget]);

  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const keyMatch = e.key.toLowerCase() === shortcut.split('+')[1]?.toLowerCase();

      if (isCtrlOrCmd && keyMatch) {
        e.preventDefault();
        toggleWidget();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcut, shortcut, toggleWidget]);

  const contextValue: AIWidgetContextValue = {
    isOpen: widgetState.isOpen,
    showWidget,
    hideWidget,
    toggleWidget
  };

  return (
    <AIWidgetContext.Provider value={contextValue}>
      {children}
      <IntelligentAIWidget />
      <AIWidgetTrigger />
    </AIWidgetContext.Provider>
  );
}

export function useAIWidgetContext() {
  const context = useContext(AIWidgetContext);
  if (context === undefined) {
    throw new Error('useAIWidgetContext must be used within AIWidgetProvider');
  }
  return context;
}
