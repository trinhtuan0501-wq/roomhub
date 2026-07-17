import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  primary: '#0ea5e9', // Sky blue main brand color
  primaryHover: '#0284c7',
  secondary: '#e0f2fe',
  success: '#10b981',
  danger: '#f43f5e',
  warning: '#f59e0b',
  info: '#3b82f6',
  
  light: {
    text: '#0f172a', // Slate 900
    background: '#f8fafc', // Slate 50
    card: '#ffffff',
    border: '#e2e8f0', // Slate 200
    textSecondary: '#64748b', // Slate 500
    backgroundElement: '#f1f5f9', // Slate 100
    backgroundSelected: '#e2e8f0',
  },
  dark: {
    text: '#f8fafc',
    background: '#0f172a',
    card: '#1e293b',
    border: '#334155',
    textSecondary: '#94a3b8',
    backgroundElement: '#334155',
    backgroundSelected: '#475569',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Courier New',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display), sans-serif',
    serif: 'var(--font-serif), serif',
    rounded: 'var(--font-rounded), sans-serif',
    mono: 'var(--font-mono), monospace',
  },
});

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
};

export const Border = {
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  width: {
    sm: 1,
    md: 2,
  },
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1200;
