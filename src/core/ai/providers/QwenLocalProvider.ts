import { AIProvider, AIAnalysisResult } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';

export class QwenLocalProvider implements AIProvider {
    name = 'Qwen-Local-WebView';
    private static sendToWebView: ((data: string) => void) | null = null;
    private static pendingRequests = new Map<string, (res: AIAnalysisResult) => void>();
    private static pendingSTT = new Map<string, (res: string) => void>();
    private static pendingSummarize = new Map<string, (res: string) => void>();

    static registerBridge(sender: (data: string) => void) {
        this.sendToWebView = sender;
    }

    static retry() {
        console.log('[QwenLocalProvider] retry() called');
        this.sendToWebView?.(JSON.stringify({ type: 'RETRY' }));
    }

    static reload() {
        console.log('[QwenLocalProvider] reload() called');
        this.sendToWebView?.(JSON.stringify({ type: 'RELOAD' }));
    }

    static handleResult(requestId: string, rawResult: string) {
        const callback = this.pendingRequests.get(requestId);
        if (callback) {
            try {
                const jsonMatch = rawResult.match(/\{.*\}/s);
                const data = jsonMatch ? JSON.parse(jsonMatch[0]) : { mood: 'none' as const, tags: [] };
                callback(data);
            } catch (e) {
                callback({ mood: 'none' as const, tags: [] });
            }
            this.pendingRequests.delete(requestId);
        }
    }

    static handleSTTResult(requestId: string, text: string) {
        const callback = this.pendingSTT.get(requestId);
        if (callback) {
            callback(text);
            this.pendingSTT.delete(requestId);
        }
    }

    static handleSummarizeResult(requestId: string, text: string) {
        const callback = this.pendingSummarize.get(requestId);
        if (callback) {
            callback(text);
            this.pendingSummarize.delete(requestId);
        }
    }

    async analyze(text: string, presetTags: string[], customPrompt?: string): Promise<AIAnalysisResult> {
        if (!QwenLocalProvider.sendToWebView) {
            throw new Error('Qwen Local Provider not initialized');
        }

        const requestId = Math.random().toString(36).substring(7);

        return new Promise((resolve) => {
            QwenLocalProvider.pendingRequests.set(requestId, resolve);

            const promptTemplate = customPrompt || DEFAULT_AI_PROMPT;
            const finalPrompt = promptTemplate
                .replace(/\$\{text\}/g, text)
                .replace(/\$\{presetTags\}/g, presetTags.join(', '));

            console.log('[Qwen Local Provider] Final Prompt:', finalPrompt.substring(0, 100) + '...');

            QwenLocalProvider.sendToWebView?.(JSON.stringify({
                type: 'ANALYZE',
                requestId,
                prompt: finalPrompt
            }));

            setTimeout(() => {
                if (QwenLocalProvider.pendingRequests.has(requestId)) {
                    resolve({ mood: 'none' as const, tags: [] });
                    QwenLocalProvider.pendingRequests.delete(requestId);
                }
            }, 120000); // 120s timeout for model download + inference
        });
    }

    async transcribe(base64Audio: string): Promise<string> {
        if (!QwenLocalProvider.sendToWebView) {
            throw new Error('Qwen Local Provider not initialized');
        }

        const requestId = 'stt_' + Math.random().toString(36).substring(7);

        return new Promise((resolve) => {
            QwenLocalProvider.pendingSTT.set(requestId, resolve);

            QwenLocalProvider.sendToWebView?.(JSON.stringify({
                type: 'STT',
                requestId,
                audio: base64Audio
            }));

            setTimeout(() => {
                if (QwenLocalProvider.pendingSTT.has(requestId)) {
                    resolve('');
                    QwenLocalProvider.pendingSTT.delete(requestId);
                }
            }, 60000);
        });
    }

    async summarize(text: string, customPrompt: string): Promise<string> {
        if (!QwenLocalProvider.sendToWebView) {
            throw new Error('Qwen Local Provider not initialized');
        }

        const requestId = 'sum_' + Math.random().toString(36).substring(7);

        return new Promise((resolve) => {
            QwenLocalProvider.pendingSummarize.set(requestId, resolve);

            const finalPrompt = customPrompt
                .replace(/\$\{text\}/g, text);

            console.log('[Qwen Local Provider] Summarize Prompt:', finalPrompt.substring(0, 100) + '...');

            QwenLocalProvider.sendToWebView?.(JSON.stringify({
                type: 'SUMMARIZE',
                requestId,
                prompt: finalPrompt
            }));

            setTimeout(() => {
                if (QwenLocalProvider.pendingSummarize.has(requestId)) {
                    resolve('分析超时，请稍后重试');
                    QwenLocalProvider.pendingSummarize.delete(requestId);
                }
            }, 120000);
        });
    }
}
