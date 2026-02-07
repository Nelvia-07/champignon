import * as FileSystem from 'expo-file-system/legacy';

const MODEL_DIR = (FileSystem.documentDirectory || '') + 'ai-models/qwen/';
const COMPLETE_MARKER = MODEL_DIR + '.complete';

// Model files to download from HuggingFace
const MODEL_ID = 'Xenova/Qwen1.5-0.5B-Chat';
const MODEL_FILES = [
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'generation_config.json',
    'onnx/model_quantized.onnx'
];

const MIRRORS = [
    'https://hf-mirror.com',
    'https://huggingface.co'
];

export interface DownloadProgress {
    file: string;
    fileIndex: number;
    totalFiles: number;
    progress: number;
}

/**
 * Check if model is fully downloaded
 */
export async function isModelCached(): Promise<boolean> {
    try {
        const info = await FileSystem.getInfoAsync(COMPLETE_MARKER);
        return info.exists;
    } catch {
        return false;
    }
}

/**
 * Get base path for local model files
 */
export function getModelBasePath(): string {
    return MODEL_DIR;
}

/**
 * Clear any partial downloads
 */
export async function clearModelCache(): Promise<void> {
    try {
        const info = await FileSystem.getInfoAsync(MODEL_DIR);
        if (info.exists) {
            await FileSystem.deleteAsync(MODEL_DIR, { idempotent: true });
        }
    } catch (e) {
        console.log('[ModelCache] Clear failed:', e);
    }
}

/**
 * Download model files with progress callback
 */
export async function downloadModel(
    onProgress: (p: DownloadProgress) => void
): Promise<boolean> {
    // Clear any partial downloads first
    await clearModelCache();

    // Create directory
    await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
    await FileSystem.makeDirectoryAsync(MODEL_DIR + 'onnx/', { intermediates: true });

    for (let i = 0; i < MODEL_FILES.length; i++) {
        const file = MODEL_FILES[i];
        const localPath = MODEL_DIR + file;

        let downloaded = false;
        for (const mirror of MIRRORS) {
            const url = `${mirror}/${MODEL_ID}/resolve/main/${file}`;

            try {
                onProgress({
                    file,
                    fileIndex: i,
                    totalFiles: MODEL_FILES.length,
                    progress: 0
                });

                const downloadResumable = FileSystem.createDownloadResumable(
                    url,
                    localPath,
                    {},
                    (downloadProgress) => {
                        const pct = downloadProgress.totalBytesExpectedToWrite > 0
                            ? Math.round((downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100)
                            : 0;
                        onProgress({
                            file,
                            fileIndex: i,
                            totalFiles: MODEL_FILES.length,
                            progress: pct
                        });
                    }
                );

                const result = await downloadResumable.downloadAsync();
                if (result?.uri) {
                    downloaded = true;
                    break;
                }
            } catch (e) {
                console.log(`[ModelCache] ${mirror} failed for ${file}:`, e);
            }
        }

        if (!downloaded) {
            console.error(`[ModelCache] Failed to download: ${file}`);
            await clearModelCache();
            return false;
        }
    }

    // Mark as complete
    await FileSystem.writeAsStringAsync(COMPLETE_MARKER, new Date().toISOString());
    return true;
}
