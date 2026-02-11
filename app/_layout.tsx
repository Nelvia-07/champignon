import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/core/theme';
import { useEffect } from 'react';
import { initDatabase } from '../src/core/storage';
import { AIEngineBridge } from '../src/ui/components/AIEngineBridge';
import * as SplashScreen from 'expo-splash-screen';

import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        DancingScript_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
            </Stack>
            <AIEngineBridge />
        </ThemeProvider>
    );
}
