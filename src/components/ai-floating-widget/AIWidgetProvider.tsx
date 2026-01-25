'use client';

import React, { useEffect, ReactNode } from 'react';
import { IntelligentAIWidget, AIWidgetTrigger } from './IntelligentAIWidget';
import { useAIWidget } from '@/lib/ai-components/useAIComponents';

interface AIWidgetProviderProps {
  children: ReactNode;
  autoInit?: boolean;
  enableShortcut?: boolean;
  shortcut?: string;
}

export function AIWidgetProvider({
  children,
  autoInit = false,
  enableShortcut = true,
  shortcut = 'Ctrl+K'
}: AIWidgetProviderProps) {
  const { showWidget, toggleWidget } = useAIWidget();
  const [isInitialized, setIsInitialized] = React.useState(false);

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

    const handleToggleEvent = () => {
      toggleWidget();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-ai-widget', handleToggleEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-ai-widget', handleToggleEvent);
    };
  }, [enableShortcut, shortcut, toggleWidget]);

  return (
    <>
      {children}
      <IntelligentAIWidget />
      <AIWidgetTrigger toggleWidget={toggleWidget} />
    </>
  );
}
