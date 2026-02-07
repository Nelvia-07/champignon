export type MoodType = 'happy' | 'sad' | 'anxious' | 'none';

export interface Tag {
    id: string;
    name: string;
    color?: string;
}

export interface MoodNote {
    id: string;
    content: string;
    timestamp: string; // ISO string
    moodType: MoodType;
    tags: string[]; // Tag names or IDs
    images?: string[]; // Array of image URIs
    isFollowUp: boolean;
    parentId?: string; // For follow-up notes
}

export type GroupedNotes = {
    [date: string]: MoodNote[];
};
