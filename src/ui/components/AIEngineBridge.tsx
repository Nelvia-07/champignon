import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { QWEN_ENGINE_HTML } from '../../core/ai/engine';
import { QwenLocalProvider } from '../../core/ai/providers/QwenLocalProvider';
import { aiStore } from '../../core/ai/store';
import { getAISettings } from '../../core/storage';

export const AIEngineBridge = () => {
    const webViewRef = useRef<WebView>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    // Check if we should load the WebView based on provider setting
    useEffect(() => {
        const settings = getAISettings();
        const isLocalQwen = settings.provider === 'qwen';
        setShouldLoad(isLocalQwen);

        if (isLocalQwen) {
            console.log('[AI Bridge] Qwen (WebView) selected, loading WebView');
        } else {
            console.log('[AI Bridge] Provider is:', settings.provider, '- Skipping legacy WebView bridge');
        }
    }, []);

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('[AI Bridge]', data.type, data.status || '', data.detail || '');

            // Normalize status to valid types
            const normalizeStatus = (s: string) => {
                if (s === 'READY') return 'READY';
                if (s === 'ERROR') return 'ERROR';
                if (s === 'DOWNLOADING') return 'DOWNLOADING';
                if (s === 'IDLE') return 'IDLE';
                return 'BUSY'; // Default to BUSY for any other status
            };

            if (data.type === 'RESULT') {
                QwenLocalProvider.handleResult(data.requestId, data.data);
                aiStore.setState({ status: 'READY' });
            } else if (data.type === 'STT_RESULT') {
                QwenLocalProvider.handleSTTResult(data.requestId, data.text);
                aiStore.setState({ status: 'READY' });
            } else if (data.type === 'SUMMARIZE_RESULT') {
                QwenLocalProvider.handleSummarizeResult(data.requestId, data.text);
                aiStore.setState({ status: 'READY' });
            } else if (data.type === 'PROGRESS') {
                aiStore.setState({
                    status: normalizeStatus(data.status),
                    progress: data.progress,
                    mirror: data.mirror,
                    detail: data.file || data.detail || data.message
                });
            } else if (data.type === 'STATUS') {
                aiStore.setState({
                    status: normalizeStatus(data.status),
                    mirror: data.mirror,
                    detail: data.detail || data.message || 'Processing...'
                });
            } else if (data.type === 'ERROR') {
                console.error('[AI Bridge] WebView Error:', data.message);
                aiStore.setState({ status: 'ERROR', error: data.message });
            }
        } catch (e) {
            console.error('[AI Bridge Error]', e);
        }
    };

    // Initialize the static bridge sender only when using local provider
    useEffect(() => {
        if (shouldLoad) {
            QwenLocalProvider.registerBridge((data: string) => {
                if (!webViewRef.current) {
                    console.warn('[AI Bridge] WebView not ready, queuing message');
                    return;
                }
                console.log('[AI Bridge] Sending message to WebView:', JSON.parse(data).type);
                webViewRef.current.postMessage(data);
            });
        }
    }, [shouldLoad]);

    // Don't render WebView if using cloud provider
    if (!shouldLoad) {
        return null;
    }

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: QWEN_ENGINE_HTML }}
                onMessage={onMessage}
                onLoadStart={() => console.log('[AI Bridge] WebView loading started...')}
                onLoad={() => console.log('[AI Bridge] WebView load complete')}
                onError={(e) => {
                    console.error('[AI Bridge] WebView Critical Load Error:', e.nativeEvent);
                    aiStore.setState({ status: 'ERROR', error: 'WebView failed to load' });
                }}
                style={styles.webView}
                originWhitelist={['*']}
                domStorageEnabled={true}
                javaScriptEnabled={true}
                mixedContentMode="always"
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 1,
        height: 1,
        opacity: 0.01,
        position: 'absolute',
        bottom: 0,
        right: 0,
        overflow: 'hidden',
    },
    webView: {
        width: 1,
        height: 1,
        backgroundColor: 'transparent',
    }
});
