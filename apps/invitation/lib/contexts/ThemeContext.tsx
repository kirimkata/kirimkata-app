'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeColors {
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryText: string;
    hover: string;
    sidebar: string;
    sidebarBorder: string;
    inputBg: string;
}

const themeColors: Record<Theme, ThemeColors> = {
    dark: {
        background: '#121212',
        card: 'rgba(255, 255, 255, 0.05)',
        text: '#F5F5F0',
        textSecondary: 'rgba(245, 245, 240, 0.6)',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: '#F5F5F0',
        primaryText: '#1a1a1a',
        hover: 'rgba(255, 255, 255, 0.1)',
        sidebar: '#1a1a1a',
        sidebarBorder: 'rgba(255, 255, 255, 0.1)',
        inputBg: 'rgba(0, 0, 0, 0.2)',
    },
    light: {
        background: '#f9fafb',
        card: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        primary: '#111827',
        primaryText: '#ffffff',
        hover: '#f3f4f6',
        sidebar: '#ffffff',
        sidebarBorder: '#e5e7eb',
        inputBg: '#ffffff',
    },
};

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const colors = themeColors[theme];

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
