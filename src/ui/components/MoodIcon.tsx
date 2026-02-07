import React from 'react';
import { Image } from 'react-native';
import { MoodType } from '../../core/models';

interface Props {
    mood: MoodType;
    size?: number;
}

const MOOD_IMAGES: Record<string, any> = {
    happy: require('../../../assets/moods/mood_happy.png'),
    anxious: require('../../../assets/moods/mood_stressed.png'),
    stressed: require('../../../assets/moods/mood_stressed.png'),
    sad: require('../../../assets/moods/mood_sad.png'),
    none: null,
};

// Scale factors to visually balance different mood icons
const MOOD_SCALES: Record<string, number> = {
    happy: 1.1,    // Slightly larger
    anxious: 1.0,
    stressed: 1.0,
    sad: 0.9,      // Slightly smaller
    none: 1.0,
};

export const MoodIcon = ({ mood, size = 54 }: Props) => {
    const source = MOOD_IMAGES[mood];
    const scale = MOOD_SCALES[mood] || 1.0;
    const adjustedSize = size * scale;

    if (!source) {
        return null;
    }

    return (
        <Image
            source={source}
            style={{ width: adjustedSize, height: adjustedSize }}
            resizeMode="contain"
        />
    );
};
