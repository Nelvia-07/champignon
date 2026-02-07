import { AIProvider, AIAnalysisResult, AISettings, AIProviderType } from './types';
import { LlamaLocalProvider } from './providers/LlamaLocalProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { DeepSeekProvider } from './providers/DeepSeekProvider';
import { getAISettings } from '../storage';
import { aiStore } from './store';

class AIService {
    private static instance: AIService;
    private provider: AIProvider;
    private settings: AISettings;

    private constructor() {
        const savedSettings = getAISettings();
        this.settings = {
            provider: savedSettings.provider as AIProviderType || 'llama',
            geminiApiKey: savedSettings.geminiApiKey || '',
            deepseekApiKey: savedSettings.deepseekApiKey || '',
            deepseekModel: savedSettings.deepseekModel || 'deepseek-chat',
            customPrompt: savedSettings.customPrompt || ''
        };
        this.provider = this.createProvider(this.settings.provider);
    }

    private createProvider(type: AIProviderType): AIProvider {
        if (type === 'gemini') {
            return new GeminiProvider(this.settings.geminiApiKey || '');
        }
        if (type === 'deepseek') {
            return new DeepSeekProvider(
                this.settings.deepseekApiKey || '',
                this.settings.deepseekModel || 'deepseek-chat'
            );
        }
        return new LlamaLocalProvider();
    }

    public static getInstance(): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }

    async analyze(text: string, presetTags: string[], customPromptOverride?: string): Promise<AIAnalysisResult> {
        const isCloud = this.settings.provider !== 'llama';
        if (isCloud) aiStore.setState({ status: 'BUSY' });

        try {
            // Use override prompt if provided, otherwise use settings prompt
            const promptToUse = customPromptOverride !== undefined ? customPromptOverride : this.settings.customPrompt;
            const result = await this.provider.analyze(text, presetTags, promptToUse);
            console.log('[AI Service] Analysis result:', result);
            return result;
        } catch (error) {
            console.error('AI Analysis failed:', error);
            return { mood: 'none', tags: [] };
        } finally {
            if (isCloud) aiStore.setState({ status: 'READY' });
        }
    }

    async summarize(text: string, customPrompt: string): Promise<string> {
        const isCloud = this.settings.provider !== 'llama';
        if (isCloud) aiStore.setState({ status: 'BUSY' });

        try {
            const result = await this.provider.summarize(text, customPrompt);
            console.log('[AI Service] Summarize result:', result.substring(0, 100) + '...');
            return result;
        } catch (error) {
            console.error('AI Summarize failed:', error);
            return '分析失败，请稍后重试';
        } finally {
            if (isCloud) aiStore.setState({ status: 'READY' });
        }
    }


    async transcribe(base64Audio: string): Promise<string> {
        const isCloud = this.settings.provider !== 'llama';
        if (isCloud) aiStore.setState({ status: 'BUSY' });

        try {
            return await this.provider.transcribe(base64Audio);
        } catch (error) {
            console.error('AI STT failed:', error);
            return '';
        } finally {
            if (isCloud) aiStore.setState({ status: 'READY' });
        }
    }

    getSettings(): AISettings {
        return this.settings;
    }

    updateSettings(newSettings: Partial<AISettings>) {
        this.settings = { ...this.settings, ...newSettings };
        this.provider = this.createProvider(this.settings.provider);
    }

    setProvider(provider: AIProvider) {
        this.provider = provider;
    }
}
export const aiService = AIService.getInstance();
