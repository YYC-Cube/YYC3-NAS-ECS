/**
 * @file 主题系统
 * @description 管理主题切换、自定义主题创建和主题持久化
 * @module ui/widget/ThemeSystem
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 * @updated 2026-01-03
 * @copyright Copyright (c) 2026 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeTransitions {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  shadows: ThemeShadows;
  borderRadius: ThemeBorderRadius;
  transitions: ThemeTransitions;
}

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  config: ThemeConfig;
  custom?: boolean;
}

export interface ThemeSystemConfig {
  defaultTheme?: string;
  enableAutoMode?: boolean;
  enableTransitions?: boolean;
  transitionDuration?: number;
  transitionEasing?: string;
  enablePersistence?: boolean;
  persistenceKey?: string;
  customThemes?: Theme[];
  onThemeChange?: (theme: Theme) => void;
}

export type ThemeChangeEvent = {
  theme: Theme;
  previousTheme: Theme;
  transition: boolean;
};

export class ThemeSystem extends EventEmitter {
  private config: Required<ThemeSystemConfig>;
  private themes: Map<string, Theme>;
  private currentTheme: Theme;
  private previousTheme: Theme | null;
  private autoMode: boolean;
  private transitionEnabled: boolean;
  private transitionDuration: number;
  private transitionEasing: string;
  private persistenceEnabled: boolean;
  private persistenceKey: string;
  private systemThemeListener: ((e: MediaQueryListEvent) => void) | null;
  private rootElement: HTMLElement | null;

  constructor(config: ThemeSystemConfig = {}) {
    super();

    this.config = {
      defaultTheme: 'light',
      enableAutoMode: true,
      enableTransitions: true,
      transitionDuration: 300,
      transitionEasing: 'ease-in-out',
      enablePersistence: true,
      persistenceKey: 'yyc3-widget-theme',
      customThemes: [],
      onThemeChange: undefined,
      ...config,
    };

    this.themes = new Map();
    this.autoMode = this.config.enableAutoMode;
    this.transitionEnabled = this.config.enableTransitions;
    this.transitionDuration = this.config.transitionDuration;
    this.transitionEasing = this.config.transitionEasing;
    this.persistenceEnabled = this.config.enablePersistence;
    this.persistenceKey = this.config.persistenceKey;
    this.systemThemeListener = null;
    this.rootElement = null;
    this.previousTheme = null;

    this.initializeBuiltinThemes();
    this.initializeCustomThemes();
    this.loadPersistedTheme();
    this.initializeSystemThemeListener();
  }

  private initializeBuiltinThemes(): void {
    const lightTheme: Theme = {
      id: 'light',
      name: 'Light',
      mode: 'light',
      config: {
        colors: {
          primary: '#3b82f6',
          secondary: '#64748b',
          accent: '#8b5cf6',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#0f172a',
          textSecondary: '#64748b',
          border: '#e2e8f0',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
          },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem',
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px',
        },
        transitions: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms',
          },
          easing: {
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    };

    const darkTheme: Theme = {
      id: 'dark',
      name: 'Dark',
      mode: 'dark',
      config: {
        colors: {
          primary: '#60a5fa',
          secondary: '#94a3b8',
          accent: '#a78bfa',
          background: '#0f172a',
          surface: '#1e293b',
          text: '#f1f5f9',
          textSecondary: '#94a3b8',
          border: '#334155',
          success: '#34d399',
          warning: '#fbbf24',
          error: '#f87171',
          info: '#60a5fa',
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            md: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
          },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem',
        },
        shadows: {
          sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
          md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
          lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
          xl: '0 20px 25px -5px rgb(0 0 0 / 0.4)',
          '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
        },
        borderRadius: {
          none: '0',
          sm: '0.125rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px',
        },
        transitions: {
          duration: {
            fast: '150ms',
            normal: '300ms',
            slow: '500ms',
          },
          easing: {
            easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
            easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
            easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
    };

    this.themes.set(lightTheme.id, lightTheme);
    this.themes.set(darkTheme.id, darkTheme);

    this.currentTheme = lightTheme;
  }

  private initializeCustomThemes(): void {
    if (this.config.customThemes) {
      this.config.customThemes.forEach(theme => {
        this.themes.set(theme.id, theme);
      });
    }
  }

  private loadPersistedTheme(): void {
    if (!this.persistenceEnabled) return;

    try {
      const persisted = localStorage.getItem(this.persistenceKey);
      if (persisted) {
        const data = JSON.parse(persisted);
        const theme = this.themes.get(data.themeId);
        if (theme) {
          this.currentTheme = theme;
          this.autoMode = data.autoMode || false;
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted theme:', error);
    }
  }

  private savePersistedTheme(): void {
    if (!this.persistenceEnabled) return;

    try {
      const data = {
        themeId: this.currentTheme.id,
        autoMode: this.autoMode,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(this.persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save persisted theme:', error);
    }
  }

  private initializeSystemThemeListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.systemThemeListener = (e: MediaQueryListEvent) => {
      if (this.autoMode) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.setTheme(systemTheme, false);
      }
    };

    mediaQuery.addEventListener('change', this.systemThemeListener);
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  mount(element: HTMLElement): void {
    this.rootElement = element;
    this.applyTheme(this.currentTheme, false);
  }

  unmount(): void {
    this.rootElement = null;
    
    if (this.systemThemeListener) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', this.systemThemeListener);
      this.systemThemeListener = null;
    }
  }

  setTheme(themeId: string, transition: boolean = true): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme with id "${themeId}" not found`);
    }

    this.previousTheme = this.currentTheme;
    this.currentTheme = theme;
    this.autoMode = false;

    this.applyTheme(theme, transition);
    this.savePersistedTheme();

    const event: ThemeChangeEvent = {
      theme: this.currentTheme,
      previousTheme: this.previousTheme!,
      transition,
    };

    this.emit('theme:change', event);

    if (this.config.onThemeChange) {
      this.config.onThemeChange(theme);
    }
  }

  setAutoMode(enabled: boolean): void {
    this.autoMode = enabled;

    if (enabled) {
      const systemTheme = this.getSystemTheme();
      this.setTheme(systemTheme, false);
    }

    this.savePersistedTheme();
    this.emit('auto:mode:change', enabled);
  }

  toggleTheme(): void {
    const newThemeId = this.currentTheme.mode === 'light' ? 'dark' : 'light';
    this.setTheme(newThemeId);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  getTheme(themeId: string): Theme | undefined {
    return this.themes.get(themeId);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  createCustomTheme(baseThemeId: string, overrides: Partial<ThemeConfig>, name: string): Theme {
    const baseTheme = this.themes.get(baseThemeId);
    if (!baseTheme) {
      throw new Error(`Base theme with id "${baseThemeId}" not found`);
    }

    const customTheme: Theme = {
      id: `custom-${Date.now()}`,
      name,
      mode: baseTheme.mode,
      custom: true,
      config: {
        ...baseTheme.config,
        colors: { ...baseTheme.config.colors, ...overrides.colors },
        typography: { ...baseTheme.config.typography, ...overrides.typography },
        spacing: { ...baseTheme.config.spacing, ...overrides.spacing },
        shadows: { ...baseTheme.config.shadows, ...overrides.shadows },
        borderRadius: { ...baseTheme.config.borderRadius, ...overrides.borderRadius },
        transitions: { ...baseTheme.config.transitions, ...overrides.transitions },
      },
    };

    this.themes.set(customTheme.id, customTheme);
    this.emit('theme:created', customTheme);

    return customTheme;
  }

  deleteCustomTheme(themeId: string): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme with id "${themeId}" not found`);
    }

    if (!theme.custom) {
      throw new Error('Cannot delete built-in theme');
    }

    this.themes.delete(themeId);
    this.emit('theme:deleted', themeId);

    if (this.currentTheme.id === themeId) {
      this.setTheme(this.config.defaultTheme);
    }
  }

  updateCustomTheme(themeId: string, overrides: Partial<ThemeConfig>): void {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme with id "${themeId}" not found`);
    }

    if (!theme.custom) {
      throw new Error('Cannot update built-in theme');
    }

    theme.config = {
      ...theme.config,
      colors: { ...theme.config.colors, ...overrides.colors },
      typography: { ...theme.config.typography, ...overrides.typography },
      spacing: { ...theme.config.spacing, ...overrides.spacing },
      shadows: { ...theme.config.shadows, ...overrides.shadows },
      borderRadius: { ...theme.config.borderRadius, ...overrides.borderRadius },
      transitions: { ...theme.config.transitions, ...overrides.transitions },
    };

    if (this.currentTheme.id === themeId) {
      this.applyTheme(theme, false);
    }

    this.emit('theme:updated', theme);
  }

  private applyTheme(theme: Theme, transition: boolean): void {
    if (!this.rootElement) return;

    const element = this.rootElement;

    if (transition && this.transitionEnabled) {
      element.style.transition = `all ${this.transitionDuration}ms ${this.transitionEasing}`;
    } else {
      element.style.transition = 'none';
    }

    const { colors, typography, spacing, shadows, borderRadius, transitions } = theme.config;

    element.style.setProperty('--color-primary', colors.primary);
    element.style.setProperty('--color-secondary', colors.secondary);
    element.style.setProperty('--color-accent', colors.accent);
    element.style.setProperty('--color-background', colors.background);
    element.style.setProperty('--color-surface', colors.surface);
    element.style.setProperty('--color-text', colors.text);
    element.style.setProperty('--color-text-secondary', colors.textSecondary);
    element.style.setProperty('--color-border', colors.border);
    element.style.setProperty('--color-success', colors.success);
    element.style.setProperty('--color-warning', colors.warning);
    element.style.setProperty('--color-error', colors.error);
    element.style.setProperty('--color-info', colors.info);

    element.style.setProperty('--font-family', typography.fontFamily);
    element.style.setProperty('--font-size-xs', typography.fontSize.xs);
    element.style.setProperty('--font-size-sm', typography.fontSize.sm);
    element.style.setProperty('--font-size-md', typography.fontSize.md);
    element.style.setProperty('--font-size-lg', typography.fontSize.lg);
    element.style.setProperty('--font-size-xl', typography.fontSize.xl);
    element.style.setProperty('--font-size-2xl', typography.fontSize['2xl']);
    element.style.setProperty('--font-size-3xl', typography.fontSize['3xl']);

    element.style.setProperty('--font-weight-normal', typography.fontWeight.normal.toString());
    element.style.setProperty('--font-weight-medium', typography.fontWeight.medium.toString());
    element.style.setProperty('--font-weight-semibold', typography.fontWeight.semibold.toString());
    element.style.setProperty('--font-weight-bold', typography.fontWeight.bold.toString());

    element.style.setProperty('--spacing-xs', spacing.xs);
    element.style.setProperty('--spacing-sm', spacing.sm);
    element.style.setProperty('--spacing-md', spacing.md);
    element.style.setProperty('--spacing-lg', spacing.lg);
    element.style.setProperty('--spacing-xl', spacing.xl);
    element.style.setProperty('--spacing-2xl', spacing['2xl']);
    element.style.setProperty('--spacing-3xl', spacing['3xl']);

    element.style.setProperty('--shadow-sm', shadows.sm);
    element.style.setProperty('--shadow-md', shadows.md);
    element.style.setProperty('--shadow-lg', shadows.lg);
    element.style.setProperty('--shadow-xl', shadows.xl);
    element.style.setProperty('--shadow-2xl', shadows['2xl']);

    element.style.setProperty('--border-radius-none', borderRadius.none);
    element.style.setProperty('--border-radius-sm', borderRadius.sm);
    element.style.setProperty('--border-radius-md', borderRadius.md);
    element.style.setProperty('--border-radius-lg', borderRadius.lg);
    element.style.setProperty('--border-radius-xl', borderRadius.xl);
    element.style.setProperty('--border-radius-full', borderRadius.full);

    element.style.setProperty('--transition-fast', transitions.duration.fast);
    element.style.setProperty('--transition-normal', transitions.duration.normal);
    element.style.setProperty('--transition-slow', transitions.duration.slow);

    element.style.setProperty('--ease-in', transitions.easing.easeIn);
    element.style.setProperty('--ease-out', transitions.easing.easeOut);
    element.style.setProperty('--ease-in-out', transitions.easing.easeInOut);

    element.setAttribute('data-theme', theme.mode);
    element.setAttribute('data-theme-id', theme.id);

    if (transition && this.transitionEnabled) {
      setTimeout(() => {
        element.style.transition = '';
      }, this.transitionDuration);
    }
  }

  enableTransitions(enabled: boolean): void {
    this.transitionEnabled = enabled;
    this.emit('transitions:changed', enabled);
  }

  setTransitionDuration(duration: number): void {
    this.transitionDuration = duration;
    this.emit('transition-duration:changed', duration);
  }

  setTransitionEasing(easing: string): void {
    this.transitionEasing = easing;
    this.emit('transition-easing:changed', easing);
  }

  isAutoMode(): boolean {
    return this.autoMode;
  }

  isTransitionsEnabled(): boolean {
    return this.transitionEnabled;
  }

  exportTheme(themeId: string): string {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme with id "${themeId}" not found`);
    }

    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): Theme {
    try {
      const theme: Theme = JSON.parse(themeJson);
      
      if (!theme.id || !theme.name || !theme.config) {
        throw new Error('Invalid theme format');
      }

      this.themes.set(theme.id, theme);
      this.emit('theme:imported', theme);

      return theme;
    } catch (error) {
      throw new Error(`Failed to import theme: ${error.message}`);
    }
  }

  resetToDefault(): void {
    this.setTheme(this.config.defaultTheme);
    this.autoMode = false;
    this.transitionEnabled = this.config.enableTransitions;
    this.transitionDuration = this.config.transitionDuration;
    this.transitionEasing = this.config.transitionEasing;
    this.savePersistedTheme();
    this.emit('theme:reset');
  }

  destroy(): void {
    this.unmount();
    this.removeAllListeners();
    this.themes.clear();
  }
}
