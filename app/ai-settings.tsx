import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../src/core/theme';
import { ChevronLeft, Save, RefreshCcw, Wifi, WifiOff, Maximize2, Check, X } from 'lucide-react-native';
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
        provider: 'qwen',
        geminiApiKey: '',
        deepseekApiKey: '',
        deepseekModel: 'deepseek-chat',
        customPrompt: ''
    });

    const [aiState, setAiState] = useState(aiStore.getState());
    const [isPromptFullScreen, setIsPromptFullScreen] = useState(false);

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
            return <Text style={{ color: theme.colors.text }}>🌐 联网模式</Text>;
        }
        switch (aiState.status) {
            case 'READY': return <Text style={{ color: theme.colors.text }}>✅ 已就绪</Text>;
            case 'DOWNLOADING': return <Text style={{ color: theme.colors.text }}>⏳ 下载中 {Math.round(aiState.progress)}%</Text>;
            case 'BUSY': return <RainbowText text="⚙️ 加载中..." style={StyleSheet.flatten([styles.statusText, { color: theme.colors.text, fontWeight: 'bold' }])} />;
            case 'ERROR': return <Text style={{ color: theme.colors.text }}>❌ {aiState.error || '连接失败'}</Text>;
            default: return <Text style={{ color: theme.colors.text }}>⚪ 未初始化</Text>;
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
                    {isCloudProvider ? (
                        <Wifi size={20} color={theme.colors.accent} />
                    ) : (
                        <WifiOff size={20} color={aiState.status === 'READY' ? '#4CAF50' : theme.colors.secondaryText} />
                    )}
                    <View style={styles.statusText}>
                        {getStatusText()}
                    </View>
                    {!isCloudProvider && (aiState.status === 'ERROR' || aiState.status === 'IDLE') && (
                        <TouchableOpacity
                            onPress={() => QwenLocalProvider.retry()}
                            style={[styles.retryBtn, { backgroundColor: theme.colors.accent }]}
                        >
                            <RefreshCcw size={14} color="#fff" />
                            <Text style={styles.retryText}>重试</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Provider Selection */}
                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.caption]}>AI 模型</Text>

                    {/* Qwen Local */}
                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setSettings({ ...settings, provider: 'qwen' })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>Qwen 本地模型</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }}>
                                离线使用，无需 API Key
                            </Text>
                        </View>
                        <View style={[styles.radio, settings.provider === 'qwen' && { backgroundColor: theme.colors.accent }]} />
                    </TouchableOpacity>

                    {/* DeepSeek */}
                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setSettings({ ...settings, provider: 'deepseek' })}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.optionText, { color: theme.colors.text }]}>DeepSeek (联网)</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }}>
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
                            <Text style={[styles.optionText, { color: theme.colors.text }]}>Google Gemini (联网)</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 2 }}>
                                需要 API Key，支持翻墙
                            </Text>
                        </View>
                        <View style={[styles.radio, settings.provider === 'gemini' && { backgroundColor: theme.colors.accent }]} />
                    </TouchableOpacity>
                </View>

                {/* DeepSeek Config */}
                {settings.provider === 'deepseek' && (
                    <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>DeepSeek 配置</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.divider }]}
                            placeholder="输入 DeepSeek API Key"
                            placeholderTextColor={theme.colors.secondaryText}
                            value={settings.deepseekApiKey}
                            onChangeText={(val) => setSettings({ ...settings, deepseekApiKey: val })}
                            secureTextEntry
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 12, marginBottom: 8 }}>
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
                                <Text style={{ color: settings.deepseekModel === 'deepseek-reasoner' ? theme.colors.accent : theme.colors.text }}>
                                    DeepSeek R1
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Gemini Config */}
                {settings.provider === 'gemini' && (
                    <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText }]}>Gemini 配置</Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.divider }]}
                            placeholder="输入 Gemini API Key"
                            placeholderTextColor={theme.colors.secondaryText}
                            value={settings.geminiApiKey}
                            onChangeText={(val) => setSettings({ ...settings, geminiApiKey: val })}
                            secureTextEntry
                        />
                    </View>
                )}

                {/* Custom Prompt */}
                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.secondaryText, marginBottom: 0 }, theme.isHandDrawn && theme.typography.caption]}>自定义提示词</Text>
                        <TouchableOpacity
                            onPress={() => setIsPromptFullScreen(true)}
                            style={{ padding: 4 }}
                        >
                            <Maximize2 size={18} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 12, color: theme.colors.secondaryText }}>
                            使用 {"${text}"} 和 {"${presetTags}"} 作为占位符
                        </Text>
                        <TouchableOpacity onPress={() => setSettings({ ...settings, customPrompt: DEFAULT_AI_PROMPT })}>
                            <Text style={{ fontSize: 12, color: theme.colors.accent }}>重置默认</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsPromptFullScreen(true)}
                        style={[styles.textArea, { borderColor: theme.colors.divider, padding: 0, overflow: 'hidden' }]}
                    >
                        <View pointerEvents="none" style={{ padding: 16 }}>
                            <TextInput
                                style={[{ color: theme.colors.text, fontSize: 14, height: '100%' }, theme.isHandDrawn && theme.typography.body, theme.isHandDrawn && { fontSize: 14 }]}
                                multiline
                                numberOfLines={10}
                                placeholder="留空即使用默认提示词"
                                placeholderTextColor={theme.colors.secondaryText}
                                value={settings.customPrompt}
                                editable={false}
                            />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Prompt Full Screen Modal */}
                <Modal
                    visible={isPromptFullScreen}
                    animationType="slide"
                    statusBarTranslucent
                >
                    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                        <SafeAreaView style={{ flex: 1 }}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                                style={{ flex: 1 }}
                            >
                                <View style={styles.fullScreenHeader}>
                                    <TouchableOpacity onPress={() => setIsPromptFullScreen(false)} style={styles.closeBtn}>
                                        <X size={24} color={theme.colors.text} />
                                    </TouchableOpacity>
                                    <Text style={[styles.title, { color: theme.colors.text }]}>编辑提示词</Text>
                                    <TouchableOpacity onPress={() => setIsPromptFullScreen(false)} style={styles.saveBtn}>
                                        <Check size={24} color={theme.colors.accent} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.fullScreenContent}>
                                    <TextInput
                                        style={[styles.fullScreenTextArea, { color: theme.colors.text, backgroundColor: theme.colors.cardBackground }, theme.isHandDrawn && theme.typography.body]}
                                        multiline
                                        placeholder="输入自定义提示词..."
                                        placeholderTextColor={theme.colors.secondaryText}
                                        value={settings.customPrompt}
                                        onChangeText={(val) => setSettings({ ...settings, customPrompt: val })}
                                        autoFocus
                                        textAlignVertical="top"
                                    />
                                    <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 12, paddingHorizontal: 4 }}>
                                        提示：使用 {"${text}"} 代表内容，{"${presetTags}"} 代表标签。
                                    </Text>
                                </View>
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    </View>
                </Modal>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 15,
        marginBottom: 16,
        gap: 12,
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
    fullScreenTextArea: {
        flex: 1,
        borderRadius: 15,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
    }
});
