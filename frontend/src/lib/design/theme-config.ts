/**
 * Centralized Theme Configuration
 * 
 * This module defines all color palettes and theme variables used throughout the app.
 * Designers can modify these values to see changes reflected across all components.
 */

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;
  
  // Card colors
  card: string;
  cardForeground: string;
  
  // Popover colors
  popover: string;
  popoverForeground: string;
  
  // Primary colors
  primary: string;
  primaryForeground: string;
  
  // Secondary colors
  secondary: string;
  secondaryForeground: string;
  
  // Muted colors
  muted: string;
  mutedForeground: string;
  
  // Accent colors
  accent: string;
  accentForeground: string;
  
  // Destructive colors
  destructive: string;
  destructiveForeground: string;
  
  // Border & input
  border: string;
  input: string;
  ring: string;
  
  // Border radius
  radius: string;
}

export interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

/**
 * Default theme configuration
 * Uses HSL format: "hue saturation% lightness%"
 */
export const defaultThemeConfig: ThemeConfig = {
  light: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    
    card: "0 0% 100%",
    cardForeground: "222.2 84% 4.9%",
    
    popover: "0 0% 100%",
    popoverForeground: "222.2 84% 4.9%",
    
    primary: "222.2 47.4% 11.2%",
    primaryForeground: "210 40% 98%",
    
    secondary: "210 40% 96.1%",
    secondaryForeground: "222.2 47.4% 11.2%",
    
    muted: "210 40% 96.1%",
    mutedForeground: "215.4 16.3% 46.9%",
    
    accent: "210 40% 96.1%",
    accentForeground: "222.2 47.4% 11.2%",
    
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "210 40% 98%",
    
    border: "214.3 31.8% 91.4%",
    input: "214.3 31.8% 91.4%",
    ring: "222.2 84% 4.9%",
    
    radius: "0.5rem",
  },
  dark: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    
    card: "222.2 84% 4.9%",
    cardForeground: "210 40% 98%",
    
    popover: "222.2 84% 4.9%",
    popoverForeground: "210 40% 98%",
    
    primary: "210 40% 98%",
    primaryForeground: "222.2 47.4% 11.2%",
    
    secondary: "217.2 32.6% 17.5%",
    secondaryForeground: "210 40% 98%",
    
    muted: "217.2 32.6% 17.5%",
    mutedForeground: "215 20.2% 65.1%",
    
    accent: "217.2 32.6% 17.5%",
    accentForeground: "210 40% 98%",
    
    destructive: "0 62.8% 30.6%",
    destructiveForeground: "210 40% 98%",
    
    border: "217.2 32.6% 17.5%",
    input: "217.2 32.6% 17.5%",
    ring: "212.7 26.8% 83.9%",
    
    radius: "0.5rem",
  },
};

/**
 * Apply theme to the document
 */
export function applyTheme(config: ThemeConfig, mode: 'light' | 'dark' = 'light') {
  const colors = mode === 'light' ? config.light : config.dark;
  const root = document.documentElement;
  
  // Apply CSS variables
  Object.entries(colors).forEach(([key, value]) => {
    // Convert camelCase to kebab-case
    const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    root.style.setProperty(`--${cssVar}`, value);
  });
}

/**
 * Preset themes for quick switching
 */
export const presetThemes: Record<string, ThemeConfig> = {
  default: defaultThemeConfig,
  
  ocean: {
    light: {
      ...defaultThemeConfig.light,
      primary: "199 89% 48%",
      primaryForeground: "0 0% 100%",
      accent: "199 89% 95%",
      accentForeground: "199 89% 48%",
    },
    dark: {
      ...defaultThemeConfig.dark,
      primary: "199 89% 60%",
      primaryForeground: "199 89% 10%",
      accent: "199 50% 20%",
      accentForeground: "199 89% 60%",
    },
  },
  
  sunset: {
    light: {
      ...defaultThemeConfig.light,
      primary: "25 95% 53%",
      primaryForeground: "0 0% 100%",
      accent: "25 95% 95%",
      accentForeground: "25 95% 53%",
    },
    dark: {
      ...defaultThemeConfig.dark,
      primary: "25 95% 65%",
      primaryForeground: "25 95% 10%",
      accent: "25 50% 20%",
      accentForeground: "25 95% 65%",
    },
  },
  
  forest: {
    light: {
      ...defaultThemeConfig.light,
      primary: "142 71% 45%",
      primaryForeground: "0 0% 100%",
      accent: "142 71% 95%",
      accentForeground: "142 71% 45%",
    },
    dark: {
      ...defaultThemeConfig.dark,
      primary: "142 71% 55%",
      primaryForeground: "142 71% 10%",
      accent: "142 50% 20%",
      accentForeground: "142 71% 55%",
    },
  },
  
  royal: {
    light: {
      ...defaultThemeConfig.light,
      primary: "271 81% 56%",
      primaryForeground: "0 0% 100%",
      accent: "271 81% 95%",
      accentForeground: "271 81% 56%",
    },
    dark: {
      ...defaultThemeConfig.dark,
      primary: "271 81% 66%",
      primaryForeground: "271 81% 10%",
      accent: "271 50% 20%",
      accentForeground: "271 81% 66%",
    },
  },
};

/**
 * Export theme as CSS
 */
export function exportThemeCSS(config: ThemeConfig): string {
  const lightVars = Object.entries(config.light)
    .map(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `    --${cssVar}: ${value};`;
    })
    .join('\n');
    
  const darkVars = Object.entries(config.dark)
    .map(([key, value]) => {
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `    --${cssVar}: ${value};`;
    })
    .join('\n');
  
  return `:root {\n${lightVars}\n  }\n\n  .dark {\n${darkVars}\n  }`;
}

