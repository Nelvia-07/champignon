import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type ThemeType = 'handdrawn' | 'minimalist' | 'mushroom';

interface ThemeColors {
    background: string;
    cardBackground: string;
    text: string;
    secondaryText: string;
    accent: string;
    divider: string;
}

interface ThemeTypography {
    title: TextStyle;
    body: TextStyle;
    caption: TextStyle;
    number: TextStyle; // Specifically for English/Numbers
}

export interface AppTheme {
    colors: ThemeColors;
    typography: ThemeTypography;
    isHandDrawn: boolean;
    paperTexture?: any;
    themeType: ThemeType;
}

const HandDrawnTheme: AppTheme = {
    colors: {
        background: '#F7F5F0', // Soft creamy background
        cardBackground: '#FFFFFF',
        text: '#444444',
        secondaryText: '#999999',
        accent: '#8D6E63', // Richer brown accent
        divider: '#D7CCC8', // Brownish divider
    },
    typography: {
        title: { fontSize: 18, color: '#333333', fontWeight: 'bold', opacity: 0.8 },
        body: { fontSize: 14, lineHeight: 22, color: '#444444', fontWeight: '400', opacity: 0.8 },
        caption: { fontSize: 12, color: '#999999', fontWeight: '400', opacity: 0.8 },
        number: { fontSize: 13, color: '#666666', fontWeight: '400', opacity: 0.5 },
    },
    isHandDrawn: true,
    themeType: 'handdrawn',
};

const MinimalistTheme: AppTheme = {
    colors: {
        background: '#F8F8F8', // Light gray background for minimalist
        cardBackground: '#FFFFFF',
        text: '#222222',
        secondaryText: '#888888',
        accent: '#333333',
        divider: '#F0F0F0',
    },
    typography: {
        title: { fontSize: 18, fontWeight: '600' },
        body: { fontSize: 14, lineHeight: 22 },
        caption: { fontSize: 12, color: '#999999' },
        number: { fontSize: 13, fontWeight: '500' },
    },
    isHandDrawn: false,
    themeType: 'minimalist',
};

const MushroomTheme: AppTheme = {
    colors: {
        background: '#FFF9F0', // Warm cream
        cardBackground: '#FFFFFF',
        text: '#5D4037', // Deep warm brown
        secondaryText: '#A1887F', // Muted brown
        accent: '#E57373', // Mushroom red
        divider: '#EFEBE9',
    },
    typography: {
        title: { fontSize: 18, color: '#4E342E', fontWeight: 'bold' },
        body: { fontSize: 14, lineHeight: 22, color: '#5D4037' },
        caption: { fontSize: 12, color: '#A1887F' },
        number: { fontSize: 13, color: '#795548' },
    },
    isHandDrawn: true,
    themeType: 'mushroom',
};

interface ThemeContextType {
    theme: AppTheme;
    themeType: ThemeType;
    setTheme: (type: ThemeType) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeType, setThemeType] = useState<ThemeType>('handdrawn');

    useEffect(() => {
        AsyncStorage.getItem('themeType').then((storedValue: string | null) => {
            if (storedValue === 'handdrawn' || storedValue === 'minimalist' || storedValue === 'mushroom') {
                setThemeType(storedValue as ThemeType);
            }
        });
    }, []);

    const setTheme = (type: ThemeType) => {
        setThemeType(type);
        AsyncStorage.setItem('themeType', type);
    };

    const toggleTheme = () => {
        const types: ThemeType[] = ['handdrawn', 'minimalist', 'mushroom'];
        const currentIndex = types.indexOf(themeType);
        const nextIndex = (currentIndex + 1) % types.length;
        setTheme(types[nextIndex]);
    };

    const getTheme = (type: ThemeType): AppTheme => {
        switch (type) {
            case 'handdrawn': return HandDrawnTheme;
            case 'minimalist': return MinimalistTheme;
            case 'mushroom': return MushroomTheme;
            default: return MushroomTheme;
        }
    };

    const theme = getTheme(themeType);

    return (
        <ThemeContext.Provider value={{ theme, themeType, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
