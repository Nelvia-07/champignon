import { MoodType } from '../models';
import { aiService } from './service';
import { updateNoteMoodAndTags } from '../storage';
import { aiStore } from './store';

export const analyzeMoodAndTags = async (text: string, presetTags: string[]): Promise<{ mood: MoodType, tags: string[] }> => {
    const result = await aiService.analyze(text, presetTags);
    return {
        mood: result.mood as MoodType,
        tags: result.tags
    };
};

/**
 * 后台异步分析并更新数据库
 */
export const analyzeNoteInBackground = async (
    noteId: string,
    text: string,
    presetTags: string[],
    onComplete?: () => void
) => {
    try {
        aiStore.setState({ analyzingNoteId: noteId });
        const analysis = await analyzeMoodAndTags(text, presetTags);
        updateNoteMoodAndTags(noteId, analysis.mood, analysis.tags);
        if (onComplete) onComplete();
    } catch (error) {
        console.error('Background AI Analysis failed:', error);
    } finally {
        aiStore.setState({ analyzingNoteId: null });
    }
};

export { aiService };
