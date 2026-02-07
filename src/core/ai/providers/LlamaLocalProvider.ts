import { AIProvider, AIAnalysisResult } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';
import { initLlama, LlamaContext } from 'llama.rn';
import { Paths, Directory, File } from 'expo-file-system';
import { aiStore } from '../store';

const MODEL_URL = 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf';
const MODEL_FILENAME = 'qwen2.5-0.5b-instruct-q4_k_m.gguf';

export class LlamaLocalProvider implements AIProvider {
    name = 'Llama-Local-Native';
    private static context: LlamaContext | null = null;
    private static isInitializing = false;
    private static modelPath: string | null = null;

    /**
     * Get the local model directory
     */
    private static getModelDir(): Directory {
        return new Directory(Paths.document, 'models');
    }

    /**
     * Get the local model file
     */
    private static getModelFile(): File {
        return new File(this.getModelDir(), MODEL_FILENAME);
    }

    /**
     * Check if model is already downloaded
     */
    static async isModelDownloaded(): Promise<boolean> {
        const modelFile = this.getModelFile();
        return modelFile.exists;
    }

    /**
     * Download the model with progress callback
     */
    static async downloadModel(onProgress?: (progress: number) => void): Promise<string> {
        const modelDir = this.getModelDir();
        const modelFile = this.getModelFile();
        const { downloadAsync, createDownloadResumable } = require('expo-file-system');

        // Create models directory if it doesn't exist
        if (!modelDir.exists) {
            modelDir.create();
        }

        // Check if already downloaded
        if (modelFile.exists) {
            console.log('[LlamaLocal] Model already exists at:', modelFile.uri);
            return modelFile.uri;
        }

        console.log('[LlamaLocal] Downloading model from:', MODEL_URL);
        aiStore.setState({ status: 'DOWNLOADING', progress: 0, detail: 'Downloading model...' });

        try {
            const downloadResumable = createDownloadResumable(
                MODEL_URL,
                modelFile.uri,
                {},
                (downloadProgress: any) => {
                    const progress = Math.round(
                        (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100
                    );
                    aiStore.setState({ status: 'DOWNLOADING', progress, detail: `Downloading: ${progress}%` });
                    onProgress?.(progress);
                }
            );

            const result = await downloadResumable.downloadAsync();

            if (!result || !result.uri) {
                throw new Error('Download failed - no URI returned');
            }

            console.log('[LlamaLocal] Model downloaded to:', result.uri);
            return result.uri;
        } catch (error) {
            console.error('[LlamaLocal] Download failed:', error);
            aiStore.setState({ status: 'ERROR', detail: 'Download failed' });
            throw error;
        }
    }

    /**
     * Initialize the Llama context
     */
    static async initialize(): Promise<LlamaContext> {
        if (this.context) {
            return this.context;
        }

        if (this.isInitializing) {
            // Wait for initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (this.context) {
                return this.context;
            }
        }

        this.isInitializing = true;

        try {
            // Download model if needed
            const modelPath = await this.downloadModel();
            this.modelPath = modelPath;

            aiStore.setState({ status: 'BUSY', detail: 'Loading model...' });
            console.log('[LlamaLocal] Initializing context with model:', modelPath);

            // Initialize the context
            this.context = await initLlama({
                model: modelPath,
                use_mlock: true,
                n_ctx: 2048,
                n_gpu_layers: 99, // Use GPU if available
            });

            aiStore.setState({ status: 'READY', detail: 'Model loaded' });
            console.log('[LlamaLocal] Context initialized successfully');
            return this.context;
        } catch (error) {
            console.error('[LlamaLocal] Failed to initialize:', error);
            aiStore.setState({ status: 'ERROR', error: String(error) });
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Release the context to free memory
     */
    static async release(): Promise<void> {
        if (this.context) {
            await this.context.release();
            this.context = null;
            console.log('[LlamaLocal] Context released');
        }
    }

    async analyze(text: string, presetTags: string[], customPrompt?: string): Promise<AIAnalysisResult> {
        try {
            const context = await LlamaLocalProvider.initialize();

            aiStore.setState({ status: 'BUSY', detail: 'Analyzing...' });

            const promptTemplate = customPrompt || DEFAULT_AI_PROMPT;
            const finalPrompt = promptTemplate
                .replace(/\$\{text\}/g, text)
                .replace(/\$\{presetTags\}/g, presetTags.join(', '));

            const result = await context.completion({
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that analyzes mood and tags from text. Always respond with valid JSON in the format: {"mood": "happy|sad|anxious|none", "tags": ["tag1", "tag2"]}'
                    },
                    {
                        role: 'user',
                        content: finalPrompt
                    }
                ],
                n_predict: 150,
                stop: ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>'],
                temperature: 0.1,
            });

            aiStore.setState({ status: 'READY' });

            // Parse the JSON response
            const responseText = result.text;
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (jsonMatch) {
                const data = JSON.parse(jsonMatch[0]);
                return {
                    mood: data.mood || 'none',
                    tags: data.tags || []
                };
            }

            return { mood: 'none', tags: [] };
        } catch (error) {
            console.error('[LlamaLocal] Analyze failed:', error);
            aiStore.setState({ status: 'READY' });
            return { mood: 'none', tags: [] };
        }
    }

    async summarize(text: string, customPrompt: string): Promise<string> {
        try {
            const context = await LlamaLocalProvider.initialize();

            aiStore.setState({ status: 'BUSY', detail: 'Summarizing...' });

            const finalPrompt = customPrompt.replace(/\$\{text\}/g, text);

            const result = await context.completion({
                messages: [
                    {
                        role: 'system',
                        content: '你是一个情绪分析助手，请用自然流畅的中文回复用户的分析请求。'
                    },
                    {
                        role: 'user',
                        content: finalPrompt
                    }
                ],
                n_predict: 300,
                stop: ['</s>', '<|end|>', '<|eot_id|>', '<|end_of_text|>', '<|im_end|>', '<|EOT|>'],
                temperature: 0.7,
            });

            aiStore.setState({ status: 'READY' });
            return result.text || '分析失败，请稍后重试';
        } catch (error) {
            console.error('[LlamaLocal] Summarize failed:', error);
            aiStore.setState({ status: 'READY' });
            return '分析失败: ' + String(error);
        }
    }

    async transcribe(base64Audio: string): Promise<string> {
        console.warn('[LlamaLocal] STT not supported - use Whisper integration');
        return '';
    }
}
