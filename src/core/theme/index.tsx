import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

export type ThemeType = 'handdrawn' | 'minimalist';

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
    paperTexture: require('../../../assets/themes/handdrawn/paper_bg.png'),
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
};

interface ThemeContextType {
    theme: AppTheme;
    themeType: ThemeType;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeType, setThemeType] = useState<ThemeType>('handdrawn');

    useEffect(() => {
        AsyncStorage.getItem('themeType').then((stored: string | null) => {
            if (stored === 'handdrawn' || stored === 'minimalist') {
                setThemeType(stored);
            }
        });
    }, []);

    const toggleTheme = () => {
        const newType = themeType === 'handdrawn' ? 'minimalist' : 'handdrawn';
        setThemeType(newType);
        AsyncStorage.setItem('themeType', newType);
    };

    const theme = themeType === 'handdrawn' ? HandDrawnTheme : MinimalistTheme;

    return (
        <ThemeContext.Provider value={{ theme, themeType, toggleTheme }}>
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
