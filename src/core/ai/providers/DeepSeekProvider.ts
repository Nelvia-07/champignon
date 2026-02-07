import { AIProvider, AIAnalysisResult } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';

export class DeepSeekProvider implements AIProvider {
    name = 'DeepSeek-API';
    private apiKey: string;
    private model: string;

    constructor(apiKey: string, model: string = 'deepseek-chat') {
        this.apiKey = apiKey;
        this.model = model;
    }

    async analyze(text: string, presetTags: string[], customPrompt?: string): Promise<AIAnalysisResult> {
        if (!this.apiKey) {
            throw new Error('DeepSeek API Key is not configured');
        }

        const prompt = (customPrompt || DEFAULT_AI_PROMPT)
            .replace('${text}', text)
            .replace('${presetTags}', presetTags.join(', '));

        const apiUrl = 'https://api.deepseek.com/chat/completions';
        console.log('[DeepSeek Provider] API URL:', apiUrl);
        console.log('[DeepSeek Provider] Model:', this.model);
        console.log('[DeepSeek Provider] Prompt:', prompt);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that analyzes mood and tags from text. Always respond with valid JSON in the format: {"mood": "happy|sad|anxious|none", "tags": ["tag1", "tag2"]}'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    response_format: { type: 'json_object' }
                })
            });

            const result = await response.json();

            if (response.status !== 200) {
                console.error('[DeepSeek Provider] API Error:', result);
                throw new Error(`DeepSeek API returned status ${response.status}: ${result.error?.message || 'Unknown error'}`);
            }

            const content = result.choices?.[0]?.message?.content;
            if (!content) throw new Error('Empty response from DeepSeek');

            const data = JSON.parse(content);
            return {
                mood: data.mood || 'none',
                tags: data.tags || []
            };
        } catch (error: any) {
            console.error('[DeepSeek Provider] Request failed:', error?.message || error);
            throw error;
        }
    }

    async transcribe(base64Audio: string): Promise<string> {
        console.warn('DeepSeek STT not implemented - use Whisper or other STT service');
        return '';
    }

    async summarize(text: string, customPrompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('DeepSeek API Key is not configured');
        }

        const prompt = customPrompt.replace('${text}', text);

        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: '你是一个情绪分析助手，请用自然语言回复用户的分析请求。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            const result = await response.json();

            if (response.status !== 200) {
                throw new Error(`DeepSeek API returned status ${response.status}`);
            }

            const content = result.choices?.[0]?.message?.content;
            return content || '分析失败，请稍后重试';
        } catch (error: any) {
            console.error('[DeepSeek Provider] Summarize failed:', error?.message || error);
            throw error;
        }
    }
}
