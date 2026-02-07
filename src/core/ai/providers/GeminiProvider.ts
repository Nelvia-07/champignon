import { AIProvider, AIAnalysisResult } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';

export class GeminiProvider implements AIProvider {
    name = 'Gemini-API';
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async analyze(text: string, presetTags: string[], customPrompt?: string): Promise<AIAnalysisResult> {
        if (!this.apiKey) {
            throw new Error('Gemini API Key is not configured');
        }

        const prompt = (customPrompt || DEFAULT_AI_PROMPT)
            .replace('${text}', text)
            .replace('${presetTags}', presetTags.join(', '));

        console.log('[Gemini Provider] Final Prompt:', prompt);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        response_mime_type: "application/json",
                    }
                })
            });

            const result = await response.json();

            if (response.status !== 200) {
                console.error('[Gemini Provider] API Error details:', result);
                throw new Error(`Gemini API returned status ${response.status}`);
            }

            const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!content) throw new Error('Empty response from Gemini');

            const data = JSON.parse(content);
            return {
                mood: data.mood || 'none',
                tags: data.tags || []
            };
        } catch (error: any) {
            console.error('[Gemini Provider] Request failed:', error?.message || error);
            if (error?.stack) console.error(error.stack);
            throw error;
        }
    }

    async transcribe(base64Audio: string): Promise<string> {
        console.warn('GeminiProvider STT not implemented yet');
        return '';
    }

    async summarize(text: string, customPrompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Gemini API Key is not configured');
        }

        const prompt = customPrompt.replace('${text}', text);

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            const result = await response.json();

            if (response.status !== 200) {
                throw new Error(`Gemini API returned status ${response.status}`);
            }

            const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
            return content || '分析失败，请稍后重试';
        } catch (error: any) {
            console.error('[Gemini Provider] Summarize failed:', error?.message || error);
            throw error;
        }
    }
}
