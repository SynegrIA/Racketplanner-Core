import { createContext, useState, useEffect, useContext } from 'react';
import themes from '../config/themeConfig.js';

// Crear el contexto
export const ThemeContext = createContext();

// Hook personalizado para usar el tema
export const useTheme = () => useContext(ThemeContext);

// Proveedor del tema
export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(themes.default);

    // Función para cambiar de tema
    const changeTheme = (themeId) => {
        if (themes[themeId]) {
            setCurrentTheme(themes[themeId]);
            localStorage.setItem('selectedTheme', themeId);
        }
    };

    // Aplicar el tema usando variables CSS
    useEffect(() => {
        const root = document.documentElement;

        // Aplicar cada color como variable CSS
        Object.entries(currentTheme).forEach(([key, value]) => {
            if (typeof value === 'string' && (key.includes('Color') || key.includes('color'))) {
                root.style.setProperty(`--${key}`, value);
            }
        });

        // También crear variables específicas para Bootstrap
        root.style.setProperty('--bs-primary', currentTheme.primaryColor);
        root.style.setProperty('--bs-secondary', currentTheme.secondaryColor);

        // Clases personalizadas para botones
        document.head.innerHTML += `
      <style>
        .btn-theme-primary {
          background-color: ${currentTheme.primaryColor};
          border-color: ${currentTheme.primaryColor};
          color: white;
        }
        .btn-theme-primary:hover {
          background-color: ${currentTheme.secondaryColor};
          border-color: ${currentTheme.secondaryColor};
        }
        .btn-theme-secondary {
          background-color: ${currentTheme.secondaryColor};
          border-color: ${currentTheme.secondaryColor};
          color: white;
        }
        .bg-theme-primary {
          background-color: ${currentTheme.primaryColor} !important;
          color: white;
        }
        .bg-theme-secondary {
          background-color: ${currentTheme.secondaryColor} !important;
          color: white;
        }
        .text-theme-accent {
          color: ${currentTheme.accentColor} !important;
        }
      </style>
    `;
    }, [currentTheme]);

    // Cargar tema guardado al inicio
    useEffect(() => {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && themes[savedTheme]) {
            setCurrentTheme(themes[savedTheme]);
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ currentTheme, changeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};