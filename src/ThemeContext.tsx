import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModuleTheme = 'cpu' | 'memory' | 'storage' | 'network' | 'security';

interface ThemeContextType {
  currentTheme: ModuleTheme;
  setTheme: (theme: ModuleTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ModuleTheme>('cpu');

  const setTheme = (theme: ModuleTheme) => {
    setCurrentTheme(theme);
    // 更新根元素的主题类名
    document.documentElement.className = document.documentElement.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.documentElement.classList.add(`theme-${theme}`);
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
