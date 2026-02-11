import { AIProvider, AIAnalysisResult } from '../types';
import { DEFAULT_AI_PROMPT } from '../constants';
import { initLlama, LlamaContext } from 'llama.rn';
import * as FileSystem from 'expo-file-system/legacy';
import { aiStore } from '../store';

const MODEL_URL = 'https://hf-mirror.com/bartowski/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';
const MODEL_FILENAME = 'Qwen2.5-0.5B-Instruct-Q4_K_M.gguf';

export class LlamaLocalProvider implements AIProvider {
    name = 'Llama-Local-Native';
    private static context: LlamaContext | null = null;
    private static isInitializing = false;
    private static modelPath: string | null = null;

    /**
     * Get the local model directory URI
     */
    private static getModelDirUri(): string {
        return (FileSystem as any).documentDirectory + 'models/';
    }

    /**
     * Get the local model file URI
     */
    private static getModelFileUri(): string {
        return this.getModelDirUri() + MODEL_FILENAME;
    }

    /**
     * Check if model is already downloaded
     */
    static async isModelDownloaded(): Promise<boolean> {
        const modelUri = this.getModelFileUri();
        const info = await FileSystem.getInfoAsync(modelUri);
        return info.exists;
    }

    /**
     * Delete the downloaded model file for re-downloading
     */
    static async deleteModel(): Promise<void> {
        const modelUri = this.getModelFileUri();
        const info = await FileSystem.getInfoAsync(modelUri);
        if (info.exists) {
            await FileSystem.deleteAsync(modelUri);
            console.log('[LlamaLocal] Model file deleted');
        }
        // Release existing context
        if (LlamaLocalProvider.context) {
            await LlamaLocalProvider.context.release();
            LlamaLocalProvider.context = null;
        }
        LlamaLocalProvider.modelPath = null;
        aiStore.setState({ status: 'IDLE', progress: 0, detail: '' });
    }

    /**
     * Download the model with progress callback
     */
    static async downloadModel(onProgress?: (progress: number) => void): Promise<string> {
        const modelDirUri = this.getModelDirUri();
        const modelFileUri = this.getModelFileUri();

        // Create models directory if it doesn't exist
        const dirInfo = await FileSystem.getInfoAsync(modelDirUri);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(modelDirUri, { intermediates: true });
        }

        // Check if already downloaded
        const info = await FileSystem.getInfoAsync(modelFileUri);
        console.log(`[LlamaLocal] Checking model file: ${modelFileUri} (Exists: ${info.exists})`);

        if (info.exists) {
            const sizeMB = ((info.size || 0) / 1024 / 1024);
            console.log(`[LlamaLocal] Existing model size: ${sizeMB.toFixed(1)}MB`);

            // Strictly check for 0.5B model size (approx 397MB)
            // If it's 807MB, it's the old 1B model - we must delete it!
            if (sizeMB > 350 && sizeMB < 450) {
                aiStore.setState({ lastLog: `模型文件已就绪 (${sizeMB.toFixed(1)}MB)，正在准备加载...` });
                return modelFileUri;
            } else {
                console.log(`[LlamaLocal] File size mismatch (${sizeMB.toFixed(1)}MB), expected ~400MB. Deleting...`);
                await FileSystem.deleteAsync(modelFileUri).catch(() => { });
                aiStore.setState({ lastLog: '模型版本不匹配，正在更新...' });
            }
        }

        console.log('[LlamaLocal] Model file missing or invalid, starting download from:', MODEL_URL);
        aiStore.setState({ status: 'DOWNLOADING', progress: 0, detail: 'Downloading model...', lastLog: '正在下载 AI 模型 (约 400MB)...' });

        let downloadResumable: any = null;
        try {
            downloadResumable = FileSystem.createDownloadResumable(
                MODEL_URL,
                modelFileUri,
                {},
                (progress) => {
                    const total = progress.totalBytesExpectedToWrite;
                    const written = progress.totalBytesWritten;
                    const p = total > 0 ? written / total : 0;

                    if (written % (1024 * 1024 * 5) === 0) { // Log every 5MB to avoid spam
                        console.log(`[LlamaLocal] Progress: ${written} / ${total} (p: ${p})`);
                    }

                    const writtenMB = (written / 1024 / 1024).toFixed(1);
                    const totalMB = total > 0 ? (total / 1024 / 1024).toFixed(1) : '?';

                    aiStore.setState({
                        progress: p,
                        lastLog: total > 0
                            ? `下载中: ${(p * 100).toFixed(1)}% (${writtenMB}MB / ${totalMB}MB)`
                            : `正在接收数据: ${writtenMB}MB (总量未知)`
                    });
                    if (onProgress) onProgress(p);
                }
            );

            const result = await downloadResumable.downloadAsync();
            if (!result || !result.uri) {
                throw new Error('Download failed: No result from downloadAsync');
            }

            // Verify final size
            const finalInfo = await FileSystem.getInfoAsync(result.uri);
            const finalSizeMB = ((finalInfo as any).size || 0) / 1024 / 1024;
            console.log(`[LlamaLocal] Download complete. URI: ${result.uri}, Size: ${finalSizeMB.toFixed(1)}MB`);

            if (finalSizeMB < 350 || finalSizeMB > 450) {
                throw new Error(`Downloaded file size mismatch: ${finalSizeMB.toFixed(1)}MB (Expected ~400MB)`);
            }

            // Verify GGUF magic bytes (first 4 bytes should be 'GGUF')
            try {
                // Read first few bytes to verify GGUF format
                const header = await FileSystem.readAsStringAsync(result.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                    length: 4,
                });
                // 'R0dVRg==' is 'GGUF' in Base64
                if (header !== 'R0dVRg==') {
                    console.error(`[LlamaLocal] Security check failed: File header is not GGUF (${header}).`);
                    // Don't throw here, just warn, maybe partial read failed but file is OK
                } else {
                    console.log('[LlamaLocal] GGUF magic bytes verified.');
                }
            } catch (e) {
                console.warn('[LlamaLocal] Could not verify GGUF header:', e);
            }

            aiStore.setState({ lastLog: '下载完成，正在验证文件...' });
            return result.uri;
        } catch (error) {
            console.error('[LlamaLocal] Download failed:', error);
            aiStore.setState({
                status: 'ERROR',
                detail: 'Download failed',
                lastLog: `下载失败: ${error instanceof Error ? error.message : '网络连接超时或中断'}`
            });
            throw error;
        } finally {
            downloadResumable = null;
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
            aiStore.setState({ status: 'BUSY', detail: 'Initializing model...', lastLog: '正在准备模型环境...' });

            const modelUri = await LlamaLocalProvider.downloadModel();

            // Verify file exists and log details
            const fileInfo = await FileSystem.getInfoAsync(modelUri);
            console.log(`[LlamaLocal] Loading model from: ${modelUri} (${fileInfo.size} bytes)`);

            if (!fileInfo.exists) {
                throw new Error(`Model file not found at ${modelUri}`);
            }

            // [CRITICAL] Strip 'file://' AND decode URI components (e.g. %20 -> space)
            // Native llama.cpp requires a raw string path, not a URL-encoded URI.
            const cleanPath = decodeURIComponent(modelUri.replace('file://', ''));
            console.log('[LlamaLocal] Native raw path:', cleanPath);

            // Enable native logs if the JSI binding exists
            try {
                if ((global as any).llamaToggleNativeLog) {
                    (global as any).llamaToggleNativeLog(true);
                    console.log('[LlamaLocal] Native logging enabled');
                }
            } catch (e) {
                console.warn('[LlamaLocal] Failed to toggle native logs:', e);
            }

            // Initialize the context
            try {
                console.log('[LlamaLocal] Calling initLlama with path:', cleanPath);
                LlamaLocalProvider.context = await initLlama({
                    model: cleanPath,
                    use_mlock: false,
                    use_mmap: false,  // Disable for troubleshooting on iOS development builds
                    n_ctx: 512,
                    n_gpu_layers: 0,
                    n_threads: 4,
                });
                console.log('[LlamaLocal] initLlama successful');
            } catch (nativeError) {
                console.error('[LlamaLocal] Native initLlama error details:', nativeError);

                // STOP auto-deleting during debug phase so user can inspect the file
                console.log('[LlamaLocal] Model loading failed. Keeping file for inspection.');

                // Extra check: is the file really a GGUF?
                const head = await FileSystem.readAsStringAsync(modelUri, { encoding: FileSystem.EncodingType.Base64, length: 4 }).catch(() => '');
                console.log(`[LlamaLocal] File header at error time (B64): ${head}`);

                throw new Error(`原生加载失败: ${nativeError instanceof Error ? nativeError.message : String(nativeError)}`);
            }

            aiStore.setState({ status: 'READY', lastLog: 'AI 引擎已就绪' });
            return LlamaLocalProvider.context;
        } catch (error) {
            console.error('[LlamaLocal] Initialization workflow failed:', error);
            aiStore.setState({
                status: 'ERROR',
                detail: 'Initialization failed',
                lastLog: `初始化失败: ${error instanceof Error ? error.message : '错误'}`
            });
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

            console.log('[LlamaLocal] Final Analysis Prompt:', finalPrompt);

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
            console.log('[LlamaLocal] Raw Analysis Response:', responseText);
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
