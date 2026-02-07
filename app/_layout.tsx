import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/core/theme';
import { useEffect } from 'react';
import { initDatabase } from '../src/core/storage';
import { AIEngineBridge } from '../src/ui/components/AIEngineBridge';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    useEffect(() => {
        initDatabase();
        SplashScreen.hideAsync();
    }, []);

    return (
        <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
            </Stack>
            <AIEngineBridge />
        </ThemeProvider>
    );
}
