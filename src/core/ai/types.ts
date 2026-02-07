import { MoodType } from '../models';

export type AIMood = 'happy' | 'sad' | 'anxious' | 'none';

export interface AIAnalysisResult {
    mood: AIMood;
    tags: string[];
}

export interface AIProvider {
    name: string;
    analyze(text: string, presetTags: string[], customPrompt?: string): Promise<AIAnalysisResult>;
    summarize(text: string, customPrompt: string): Promise<string>;
    transcribe(base64Audio: string): Promise<string>;
}

export type AIProviderType = 'llama' | 'gemini' | 'deepseek';

export interface AISettings {
    provider: AIProviderType;
    geminiApiKey?: string;
    deepseekApiKey?: string;
    deepseekModel?: string; // 'deepseek-chat' or 'deepseek-reasoner'
    customPrompt?: string;
}
