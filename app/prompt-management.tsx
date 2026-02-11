import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { useTheme } from '../src/core/theme';
import { ChevronLeft, Save, Sparkles, Receipt, ListTodo, Smile, RotateCcw, Plus, X, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getPrompt, savePrompt, getSummaryPresets, saveSummaryPresets } from '../src/core/storage';
import { DEFAULT_AI_PROMPT } from '../src/core/ai/constants';

const DEFAULT_SUMMARY_PROMPT = '用二百字左右，总结我这段时间的整体心情起伏、主要关注的事项以及给我的建议。';
const FINANCE_PROMPT = '用一百字左右，分析我这一阶段与理财相关的内容，总结我的收支情况和理财习惯。';

export default function PromptManagementScreen() {
    const { theme } = useTheme();
    const router = useRouter();

    const [analysisPrompt, setAnalysisPrompt] = useState('');
    const [summaryPrompt, setSummaryPrompt] = useState('');
    const [presets, setPresets] = useState<{ title: string, prompt: string }[]>([]);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newPresetTitle, setNewPresetTitle] = useState('');
    const [newPresetPrompt, setNewPresetPrompt] = useState('');

    useEffect(() => {
        const p1 = getPrompt('analysis');
        const p2 = getPrompt('summary');
        const savedPresets = getSummaryPresets();

        setAnalysisPrompt(p1 || DEFAULT_AI_PROMPT);
        setSummaryPrompt(p2 || DEFAULT_SUMMARY_PROMPT);

        if (savedPresets.length === 0) {
            setPresets([{ title: '理财分析', prompt: FINANCE_PROMPT }]);
        } else {
            setPresets(savedPresets);
        }
    }, []);

    const handleSave = () => {
        savePrompt('analysis', analysisPrompt);
        savePrompt('summary', summaryPrompt);
        saveSummaryPresets(presets);

        // Refresh AI Service settings so changes take effect immediately
        const { aiService } = require('../src/core/ai');
        aiService.updateSettings({ customPrompt: analysisPrompt });

        router.back();
    };

    const resetAnalysis = () => setAnalysisPrompt(DEFAULT_AI_PROMPT);
    const resetSummary = () => setSummaryPrompt(DEFAULT_SUMMARY_PROMPT);

    const handleAddOrUpdatePreset = () => {
        if (newPresetTitle.trim() && newPresetPrompt.trim()) {
            if (editingIndex !== null) {
                const newPresets = [...presets];
                newPresets[editingIndex] = { title: newPresetTitle.trim(), prompt: newPresetPrompt.trim() };
                setPresets(newPresets);
            } else {
                setPresets([...presets, { title: newPresetTitle.trim(), prompt: newPresetPrompt.trim() }]);
            }
            closeModal();
        }
    };

    const openEditModal = (index: number) => {
        setEditingIndex(index);
        setNewPresetTitle(presets[index].title);
        setNewPresetPrompt(presets[index].prompt);
        setIsAddModalVisible(true);
    };

    const closeModal = () => {
        setEditingIndex(null);
        setNewPresetTitle('');
        setNewPresetPrompt('');
        setIsAddModalVisible(false);
    };

    const deletePreset = (index: number) => {
        const newPresets = [...presets];
        newPresets.splice(index, 1);
        setPresets(newPresets);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>提示词管理</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Save size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={18} color={theme.colors.accent} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>单条笔记分析</Text>
                        </View>
                        <TouchableOpacity onPress={resetAnalysis}>
                            <RotateCcw size={16} color={theme.colors.secondaryText} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
                        用于分析单条笔记时的情绪和标签提取模板。
                    </Text>
                    <TextInput
                        style={[styles.textAreaSmall, { color: theme.colors.text, borderColor: theme.colors.divider }, theme.isHandDrawn && theme.typography.body]}
                        multiline
                        numberOfLines={4}
                        value={analysisPrompt}
                        onChangeText={setAnalysisPrompt}
                        textAlignVertical="top"
                    />
                </View>

                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={styles.sectionHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ListTodo size={18} color={theme.colors.accent} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>周期总结分析</Text>
                        </View>
                        <TouchableOpacity onPress={resetSummary}>
                            <RotateCcw size={16} color={theme.colors.secondaryText} />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.description, { color: theme.colors.secondaryText }]}>
                        用于在日历页面进行总结的默认模板（占位内容）。
                    </Text>
                    <TextInput
                        style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.divider }, theme.isHandDrawn && theme.typography.body]}
                        multiline
                        numberOfLines={4}
                        value={summaryPrompt}
                        onChangeText={setSummaryPrompt}
                        textAlignVertical="top"
                    />

                    <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                        <Text style={[styles.subTitle, { color: theme.colors.text, marginBottom: 0 }]}>总结预设</Text>
                        <TouchableOpacity onPress={() => setIsAddModalVisible(true)}>
                            <Plus size={20} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.presetList}>
                        {presets.map((preset, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.presetTag, { backgroundColor: theme.colors.divider + '40' }]}
                                onPress={() => openEditModal(index)}
                            >
                                <Text style={[styles.presetTagText, { color: theme.colors.text }]}>{preset.title}</Text>
                                <TouchableOpacity
                                    style={styles.deleteCircle}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        deletePreset(index);
                                    }}
                                >
                                    <X size={12} color={theme.colors.secondaryText} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Add Preset Modal */}
            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                        <View style={[styles.modalCard, { backgroundColor: theme.colors.cardBackground }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                    {editingIndex !== null ? '编辑总结预设' : '新增总结预设'}
                                </Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <X size={24} color={theme.colors.text} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.divider }]}
                                placeholder="预设标题 (如: 理财分析)"
                                placeholderTextColor={theme.colors.secondaryText}
                                value={newPresetTitle}
                                onChangeText={setNewPresetTitle}
                            />

                            <TextInput
                                style={[styles.textArea, { color: theme.colors.text, borderColor: theme.colors.divider, marginTop: 12, height: 200 }]}
                                placeholder="提示词内容..."
                                placeholderTextColor={theme.colors.secondaryText}
                                multiline
                                value={newPresetPrompt}
                                onChangeText={setNewPresetPrompt}
                                textAlignVertical="top"
                            />

                            <TouchableOpacity
                                style={[styles.submitBtn, { backgroundColor: theme.colors.accent }]}
                                onPress={handleAddOrUpdatePreset}
                            >
                                <Text style={styles.submitBtnText}>
                                    {editingIndex !== null ? '保存修改' : '确认添加'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
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
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 12,
        marginBottom: 12,
        lineHeight: 18,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 15,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        lineHeight: 20,
    },
    textAreaSmall: {
        borderWidth: 1,
        borderRadius: 15,
        padding: 12,
        fontSize: 14,
        height: 300,
        lineHeight: 20,
    },
    subTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    presetList: {
        marginTop: 10,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        position: 'relative',
    },
    presetTagText: {
        fontSize: 14,
        fontWeight: '500',
    },
    deleteCircle: {
        marginLeft: 8,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 10,
        padding: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
    },
    modalCard: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
    },
    submitBtn: {
        marginTop: 20,
        padding: 16,
        borderRadius: 15,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
