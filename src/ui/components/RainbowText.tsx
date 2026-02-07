import React from 'react';
import { Text, TextStyle, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface RainbowTextProps {
    text: string;
    style?: TextStyle;
}

export const RainbowText = ({ text, style }: RainbowTextProps) => {
    return (
        <MaskedView
            maskElement={
                <Text style={[style, { backgroundColor: 'transparent' }]}>
                    {text}
                </Text>
            }
        >
            <LinearGradient
                colors={['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#A777E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={[style, { opacity: 0 }]}>
                    {text}
                </Text>
            </LinearGradient>
        </MaskedView>
    );
};
