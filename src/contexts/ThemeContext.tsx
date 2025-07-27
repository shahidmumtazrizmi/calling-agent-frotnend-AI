import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the initial theme mode from localStorage or default to 'light'
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('theme_mode');
    return (savedMode as PaletteMode) || 'light';
  });

  // Create the theme based on the current mode
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#3f51b5',
        light: '#757de8',
        dark: '#002984',
      },
      secondary: {
        main: '#f50057',
        light: '#ff4081',
        dark: '#c51162',
      },
      background: {
        default: mode === 'light' ? '#f5f5f5' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 500,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: mode === 'light' 
              ? '0px 2px 4px rgba(0, 0, 0, 0.1)' 
              : '0px 2px 4px rgba(0, 0, 0, 0.3)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'light'
              ? '0px 2px 4px rgba(0, 0, 0, 0.1)'
              : '0px 2px 4px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
  });

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Save the theme mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
  }, [mode]);

  const value = {
    mode,
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
