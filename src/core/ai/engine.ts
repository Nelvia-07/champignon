export const QWEN_ENGINE_HTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Engine</title>
</head>
<body>
    <div id="status">Ready</div>
    <script type="module">
        // --- Communication ---
        function logToRN(type, data) {
            try {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
                }
            } catch (e) {}
        }

        logToRN('STATUS', { status: 'BUSY', detail: 'Script started' });

        window.onerror = (msg) => logToRN('ERROR', { message: 'Error: ' + msg });

        const MODEL_ID = 'Xenova/Qwen1.5-0.5B-Chat';
        let generator = null;

        // --- Message Handler ---
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);

        function handleMessage(event) {
            let config;
            try { config = JSON.parse(event.data); } catch (e) { return; }
            
            if (config.type === 'RELOAD') {
                window.location.reload();
            } else if (config.type === 'RETRY') {
                generator = null;
                logToRN('STATUS', { status: 'BUSY', detail: 'Retry...' });
                startInit();
            } else if (config.type === 'ANALYZE') {
                handleAnalyze(config);
            } else if (config.type === 'SUMMARIZE') {
                handleSummarize(config);
            }
        }

        // --- Library Loading ---
        const LIB_SOURCES = [
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
            'https://npm.elemecdn.com/@xenova/transformers@2.17.2',
            'https://unpkg.com/@xenova/transformers@2.17.2'
        ];

        async function loadLibrary(index = 0) {
            logToRN('STATUS', { status: 'BUSY', detail: 'Loading lib ' + (index + 1) + '/3' });
            if (index >= LIB_SOURCES.length) {
                logToRN('ERROR', { message: 'All CDN sources failed' });
                return null;
            }
            try {
                return await import(LIB_SOURCES[index]);
            } catch (e) {
                return loadLibrary(index + 1);
            }
        }

        // --- Model Initialization ---
        const MIRRORS = [
            'https://hf-mirror.com',
            'https://huggingface.co',
            'https://aliendao.cn/models'
        ];

        async function initModel(lib) {
            const { pipeline, env } = lib;
            if (!pipeline || !env) throw new Error('Invalid library');

            for (const host of MIRRORS) {
                try {
                    logToRN('STATUS', { status: 'BUSY', mirror: host, detail: 'Trying mirror...' });
                    env.allowLocalModels = false;
                    env.useBrowserCache = false; // Not available in WebView
                    env.remoteHost = host;
                    env.remotePathTemplate = '{model}/resolve/{revision}';

                    logToRN('STATUS', { status: 'BUSY', mirror: host, detail: 'Loading model...' });
                    generator = await pipeline('text-generation', MODEL_ID, {
                        revision: 'main',
                        progress_callback: (p) => {
                            const fileName = p.file || 'unknown';
                            const pct = Math.round(p.progress || 0);
                            // Log all files to Metro console
                            logToRN('STATUS', { status: 'BUSY', detail: 'DL: ' + fileName + ' ' + pct + '%' });
                            // Only update UI progress bar for main model files
                            if (fileName.includes('onnx') || fileName.includes('safetensors')) {
                                logToRN('PROGRESS', { 
                                    status: 'DOWNLOADING', 
                                    mirror: host,
                                    progress: pct
                                });
                            }
                        }
                    });
                    logToRN('STATUS', { status: 'READY', mirror: host });
                    return generator;
                } catch (e) {
                    logToRN('STATUS', { status: 'BUSY', detail: 'Mirror failed: ' + host + ' - ' + e.message });
                }
            }
            throw new Error('All mirrors failed');
        }

        // --- Analyze Handler ---
        async function handleAnalyze(config) {
            try {
                if (!generator) throw new Error('AI not ready');
                logToRN('STATUS', { status: 'BUSY', detail: 'Thinking...' });
                const out = await generator(config.prompt, {
                    max_new_tokens: 120, temperature: 0.1, do_sample: false, return_full_text: false
                });
                if (out && out[0]) {
                    logToRN('RESULT', { requestId: config.requestId, data: out[0].generated_text });
                } else {
                    throw new Error('Empty response');
                }
            } catch (e) {
                logToRN('ERROR', { requestId: config.requestId, message: e.message });
            }
        }

        // --- Summarize Handler (raw text output) ---
        async function handleSummarize(config) {
            try {
                if (!generator) throw new Error('AI not ready');
                logToRN('STATUS', { status: 'BUSY', detail: 'Summarizing...' });
                const out = await generator(config.prompt, {
                    max_new_tokens: 300, temperature: 0.7, do_sample: true, return_full_text: false
                });
                if (out && out[0]) {
                    logToRN('SUMMARIZE_RESULT', { requestId: config.requestId, text: out[0].generated_text });
                } else {
                    throw new Error('Empty response');
                }
            } catch (e) {
                logToRN('SUMMARIZE_RESULT', { requestId: config.requestId, text: '分析失败: ' + e.message });
            }
        }

        // --- Main Entry Point ---
        async function startInit() {
            try {
                const lib = await loadLibrary();
                if (!lib) return;
                
                logToRN('STATUS', { status: 'BUSY', detail: 'Library ready!' });
                await initModel(lib);
            } catch (e) {
                logToRN('ERROR', { message: e.message });
            }
        }

        // Auto-start
        startInit();
    </script>
</body>
</html>
`;

/**
 * Generate engine HTML configured to load model from local file path
 */
export function getEngineHtmlWithLocalModel(localModelPath: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Engine</title>
</head>
<body>
    <div id="status">Ready</div>
    <script type="module">
        // --- Communication ---
        function logToRN(type, data) {
            try {
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
                }
            } catch (e) {}
        }

        logToRN('STATUS', { status: 'BUSY', detail: 'Loading from cache...' });

        window.onerror = (msg) => logToRN('ERROR', { message: 'Error: ' + msg });

        const LOCAL_MODEL_PATH = '${localModelPath}';
        let generator = null;

        // --- Message Handler ---
        document.addEventListener('message', handleMessage);
        window.addEventListener('message', handleMessage);

        function handleMessage(event) {
            let config;
            try { config = JSON.parse(event.data); } catch (e) { return; }
            
            if (config.type === 'RELOAD') {
                window.location.reload();
            } else if (config.type === 'RETRY') {
                generator = null;
                logToRN('STATUS', { status: 'BUSY', detail: 'Retry...' });
                startInit();
            } else if (config.type === 'ANALYZE') {
                handleAnalyze(config);
            } else if (config.type === 'SUMMARIZE') {
                handleSummarize(config);
            }
        }

        // --- Library Loading ---
        const LIB_SOURCES = [
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
            'https://npm.elemecdn.com/@xenova/transformers@2.17.2',
            'https://unpkg.com/@xenova/transformers@2.17.2'
        ];

        async function loadLibrary(index = 0) {
            logToRN('STATUS', { status: 'BUSY', detail: 'Loading lib ' + (index + 1) + '/3' });
            if (index >= LIB_SOURCES.length) {
                logToRN('ERROR', { message: 'All CDN sources failed' });
                return null;
            }
            try {
                return await import(LIB_SOURCES[index]);
            } catch (e) {
                return loadLibrary(index + 1);
            }
        }

        // --- Model Initialization from Local Cache ---
        async function initModel(lib) {
            const { pipeline, env } = lib;
            if (!pipeline || !env) throw new Error('Invalid library');

            try {
                logToRN('STATUS', { status: 'BUSY', detail: 'Loading cached model...' });
                env.allowLocalModels = true;
                env.allowRemoteModels = false;
                env.localModelPath = LOCAL_MODEL_PATH;
                env.useBrowserCache = false;

                // Use a simple model name - localModelPath will be the base directory
                generator = await pipeline('text-generation', 'local-model', {
                    local_files_only: true,
                    progress_callback: (p) => {
                        logToRN('STATUS', { status: 'BUSY', detail: 'Loading: ' + (p.file || 'model') });
                    }
                });
                logToRN('STATUS', { status: 'READY', detail: 'Loaded from cache' });
                return generator;
            } catch (e) {
                logToRN('ERROR', { message: 'Local load failed: ' + e.message });
                throw e;
            }
        }

        // --- Analyze Handler ---
        async function handleAnalyze(config) {
            try {
                if (!generator) throw new Error('AI not ready');
                logToRN('STATUS', { status: 'BUSY', detail: 'Thinking...' });
                const out = await generator(config.prompt, {
                    max_new_tokens: 120, temperature: 0.1, do_sample: false, return_full_text: false
                });
                if (out && out[0]) {
                    logToRN('RESULT', { requestId: config.requestId, data: out[0].generated_text });
                } else {
                    throw new Error('Empty response');
                }
            } catch (e) {
                logToRN('ERROR', { requestId: config.requestId, message: e.message });
            }
        }

        // --- Summarize Handler (raw text output) ---
        async function handleSummarize(config) {
            try {
                if (!generator) throw new Error('AI not ready');
                logToRN('STATUS', { status: 'BUSY', detail: 'Summarizing...' });
                const out = await generator(config.prompt, {
                    max_new_tokens: 300, temperature: 0.7, do_sample: true, return_full_text: false
                });
                if (out && out[0]) {
                    logToRN('SUMMARIZE_RESULT', { requestId: config.requestId, text: out[0].generated_text });
                } else {
                    throw new Error('Empty response');
                }
            } catch (e) {
                logToRN('SUMMARIZE_RESULT', { requestId: config.requestId, text: '分析失败: ' + e.message });
            }
        }

        // --- Main Entry Point ---
        async function startInit() {
            try {
                const lib = await loadLibrary();
                if (!lib) return;
                
                logToRN('STATUS', { status: 'BUSY', detail: 'Library ready!' });
                await initModel(lib);
            } catch (e) {
                logToRN('ERROR', { message: e.message });
            }
        }

        // Auto-start
        startInit();
    </script>
</body>
</html>
`;
}
