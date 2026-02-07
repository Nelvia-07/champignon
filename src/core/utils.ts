import { MoodType } from './models';

/**
 * Helper to generate tag styles with translucent background and darker text
 */
export const getTagStyles = (baseColor: string = '#E0E0E0') => {
    // 1. Parse Hex
    let c = baseColor.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');

    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);

    // 2. Background: Low opacity version (0.2)
    const bg = `rgba(${r}, ${g}, ${b}, 0.2)`;

    // 3. Text: Darker version
    const factor = 0.4;
    const darkR = Math.floor(r * factor);
    const darkG = Math.floor(g * factor);
    const darkB = Math.floor(b * factor);
    const text = `rgb(${darkR}, ${darkG}, ${darkB})`;

    return { backgroundColor: bg, color: text };
};

/**
 * Lightens a color for background use (e.g. 0.05 opacity)
 */
export const lightenColor = (hex: string, opacity: number = 0.05) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Maps mood to base color
 */
export const getMoodColor = (mood: MoodType): string => {
    switch (mood) {
        case 'happy': return '#FFB6C1'; // Light pink

        case 'sad': return '#80C4FF'; // Darker blue
        case 'anxious': return '#A0A0A0'; // Darker gray
        default: return '#E0E0E0';
    }
};
