import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../src/core/theme';
import { ChevronLeft, Save, RefreshCcw, Wifi, WifiOff, Maximize2, Check, X, Download } from 'lucide-react-native';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { aiService } from '../src/core/ai';
import { AISettings, AIProviderType } from '../src/core/ai/types';
import { updateAISettings } from '../src/core/storage';
import { DEFAULT_AI_PROMPT } from '../src/core/ai/constants';
import { aiStore } from '../src/core/ai/store';
import { QwenLocalProvider } from '../src/core/ai/providers/QwenLocalProvider';
import { RainbowText } from '../src/ui/components/RainbowText';

export default function AISettingsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [settings, setSettings] = useState<AISettings>({
        provider: 'llama',
        geminiApiKey: '',
        deepseekApiKey: '',
        deepseekModel: 'deepseek-chat',
        customPrompt: ''
    });

    const [aiState, setAiState] = useState(aiStore.getState());

    useEffect(() => {
        const currentSettings = aiService.getSettings();
        setSettings({
            ...currentSettings,
            customPrompt: currentSettings.customPrompt || DEFAULT_AI_PROMPT
        });

        const unsubscribe = aiStore.subscribe((state) => {
            setAiState({ ...state });
        });
        return unsubscribe;
    }, []);

    const handleSave = () => {
        aiService.updateSettings(settings);
        updateAISettings('provider', settings.provider);
        updateAISettings('geminiApiKey', settings.geminiApiKey || '');
        updateAISettings('deepseekApiKey', settings.deepseekApiKey || '');
        updateAISettings('deepseekModel', settings.deepseekModel || 'deepseek-chat');
        updateAISettings('customPrompt', settings.customPrompt || '');
        router.back();
    };

    const isCloudProvider = settings.provider === 'gemini' || settings.provider === 'deepseek';

    const getStatusText = () => {
        if (isCloudProvider) {
            return <Text style={[{ color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>🌐 联网模式</Text>;
        }

        // Stabilize: prioritize progress display during download or busy states
        const hasProgress = aiState.progress > 0 && aiState.progress <= 100;
        if (aiState.status === 'DOWNLOADING' || (aiState.status === 'BUSY' && hasProgress)) {
            return <Text style={[{ color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>⏳ 下载中...</Text>;
        }

        switch (aiState.status) {
            case 'READY': return <Text style={[{ color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>✅ 已就绪</Text>;
            case 'BUSY': return <RainbowText text="⚙️ 加载中..." style={StyleSheet.flatten([styles.statusText, { color: theme.colors.text, fontWeight: 'bold' }, theme.isHandDrawn && theme.typography.body])} />;
            case 'ERROR': return <Text style={[{ color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>❌ {aiState.error || '连接失败'}</Text>;
            default: return <Text style={[{ color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>⚪ 未初始化</Text>;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>AI 设置</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Save size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {isCloudProvider ? (
                            <Wifi size={20} color={theme.colors.accent} />
                        ) : (
                            <WifiOff size={20} color={aiState.status === 'READY' ? '#4CAF50' : theme.colors.secondaryText} />
                        )}
                        <View style={styles.statusText}>
                            {getStatusText()}
                        </View>
                    </View>
                    {!isCloudProvider && (
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                            {(aiState.status === 'ERROR' || aiState.status === 'IDLE' || aiState.status === 'READY') && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        if (settings.provider === 'llama') {
                                            const { LlamaLocalProvider } = await import('../src/core/ai/providers/LlamaLocalProvider');
                                            await LlamaLocalProvider.initialize();
                                        } else {
                                            QwenLocalProvider.retry();
                                        }
                                    }}
                                    style={[styles.retryBtn, { backgroundColor: theme.colors.accent }]}
                                >
                                    <RefreshCcw size={14} color="#fff" />
                                    <Text style={styles.retryText}>重试</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {(aiState.status === 'DOWNLOADING' || (aiState.progress > 0 && aiState.progress < 1)) && (
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { backgroundColor: theme.colors.divider }]}>
                                <View style={[styles.progressFill, { width: `${aiState.progress * 100}%`, backgroundColor: theme.colors.accent }]} />
                            </View>
                            <Text style={[styles.progressText, { color: theme.colors.secondaryText }]}>
                                {Math.round(aiState.progress * 100)}%
                            </Text>
                        </View>
                    )}

                    {aiState.lastLog ? (
                        <View style={[styles.statusTextContainer, { borderTopColor: theme.colors.divider + '50', borderTopWidth: 1, marginTop: 10, paddingTop: 10 }]}>
                            <Text style={{ color: theme.colors.secondaryText, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                                {aiState.lastLog}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {/* Provider Selection */}
                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.caption]}>AI 模型</Text>

                    {/* Llama Local */}
                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setSettings({ ...settings, provider: 'llama' })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>Llama 本地模型 (推荐)</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }}>
                                离线使用，效果更佳，无需 API Key
                            </Text>
                        </View>
                        <View style={[styles.radio, settings.provider === 'llama' && { backgroundColor: theme.colors.accent }]} />
                    </TouchableOpacity>

                    {/* DeepSeek */}
                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setSettings({ ...settings, provider: 'deepseek' })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>DeepSeek (联网)</Text>
                            <Text style={[{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }, theme.isHandDrawn && theme.typography.caption]}>
                                高质量中文模型，需要 API Key
                            </Text>
                        </View>
                        <View style={[styles.radio, settings.provider === 'deepseek' && { backgroundColor: theme.colors.accent }]} />
                    </TouchableOpacity>

                    {/* Gemini */}
                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setSettings({ ...settings, provider: 'gemini' })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>Google Gemini (联网)</Text>
                            <Text style={[{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }, theme.isHandDrawn && theme.typography.caption]}>
                                需要 API Key，支持翻墙
                            </Text>
                        </View>
                        <View style={[styles.radio, settings.provider === 'gemini' && { backgroundColor: theme.colors.accent }]} />
                    </TouchableOpacity>
                </View>

                {/* DeepSeek Config */}
                {settings.provider === 'deepseek' && (
                    <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.caption]}>DeepSeek 配置</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.divider }, theme.isHandDrawn && theme.typography.body]}
                            placeholder="输入 DeepSeek API Key"
                            placeholderTextColor={theme.colors.secondaryText}
                            value={settings.deepseekApiKey}
                            onChangeText={(val) => setSettings({ ...settings, deepseekApiKey: val })}
                            secureTextEntry
                        />
                        <Text style={[{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 12, marginBottom: 8 }, theme.isHandDrawn && theme.typography.caption]}>
                            选择模型
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={[
                                    styles.modelBtn,
                                    { borderColor: settings.deepseekModel === 'deepseek-chat' ? theme.colors.accent : theme.colors.divider }
                                ]}
                                onPress={() => setSettings({ ...settings, deepseekModel: 'deepseek-chat' })}
                            >
                                <Text style={{ color: settings.deepseekModel === 'deepseek-chat' ? theme.colors.accent : theme.colors.text }}>
                                    DeepSeek V3
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modelBtn,
                                    { borderColor: settings.deepseekModel === 'deepseek-reasoner' ? theme.colors.accent : theme.colors.divider }
                                ]}
                                onPress={() => setSettings({ ...settings, deepseekModel: 'deepseek-reasoner' })}
                            >
                                <Text style={[{ color: settings.deepseekModel === 'deepseek-reasoner' ? theme.colors.accent : theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>
                                    DeepSeek R1
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Gemini Config */}
                {settings.provider === 'gemini' && (
                    <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.caption]}>Gemini 配置</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.divider }, theme.isHandDrawn && theme.typography.body]}
                            placeholder="输入 Gemini API Key"
                            placeholderTextColor={theme.colors.secondaryText}
                            value={settings.geminiApiKey}
                            onChangeText={(val) => setSettings({ ...settings, geminiApiKey: val })}
                            secureTextEntry
                        />
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    backBtn: {
        padding: 4,
    },
    saveBtn: {
        padding: 4,
    },
    closeBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statusCard: {
        padding: 16,
        borderRadius: 15,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    retryText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '500',
    },
    section: {
        borderRadius: 15,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        opacity: 0.7,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 16,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#ddd',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 15,
        padding: 16,
        fontSize: 14,
        height: 200,
        textAlignVertical: 'top',
        lineHeight: 20,
    },
    modelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    fullScreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    fullScreenContent: {
        flex: 1,
        padding: 16,
    },
    progressContainer: {
        marginTop: 15,
        gap: 8,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        textAlign: 'right',
    },
    statusTextContainer: {
        marginTop: 5,
    },
    fullScreenTextArea: {
        flex: 1,
        borderRadius: 15,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
    }
});
