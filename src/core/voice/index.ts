import { NativeModules, Platform } from 'react-native';

// Helper to check if the Voice native module actually exists in the current binary
export const isVoiceSupported = () => {
    if (Platform.OS === 'web') return false;

    // Check for the native module specifically from the library
    // The library usually registers itself as VoiceModule or similar
    // We check both NativeModules.Voice and potentially others
    return !!(NativeModules.Voice || NativeModules.VoiceModule || NativeModules.RNCVoice);
};

export const getVoiceModule = () => {
    if (!isVoiceSupported()) return null;
    try {
        const Voice = require('@react-native-voice/voice').default;
        return Voice || null;
    } catch (e) {
        return null;
    }
};
