import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, ActivityIndicator, Modal as RNModal, Image as RNImage, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated, PanResponder } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { Send, XCircle, Image as ImageIcon, Mic, ChevronDown, X, RefreshCcw, Plus } from 'lucide-react-native';
import { MoodNote } from '../../core/models';
import { saveNote, getAllPresetTags, getGeneralSettings } from '../../core/storage';
import { analyzeNoteInBackground } from '../../core/ai';
import { aiStore } from '../../core/ai/store';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { RainbowText } from './RainbowText';

const isWeb = Platform.OS === 'web';
// Robust check for expo-constants properties
const isExpoGo = !isWeb && Constants.appOwnership === 'expo';

// Conditional require for native voice module
const Voice = (!isExpoGo && !isWeb) ? require('@react-native-voice/voice').default : null;

interface Props {
    parentNote: MoodNote | null;
    onClearParent: () => void;
    onSuccess: () => void;
}

export const InputArea = ({ parentNote, onClearParent, onSuccess }: Props) => {
    const { theme } = useTheme();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [aiState, setAiState] = useState(aiStore.getState());
    const [isCollapsed, setIsCollapsed] = useState(true); // Default to true initially

    const pan = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isExpoGo && !isWeb && Voice) {
            try {
                Voice.onSpeechStart = () => setIsRecording(true);
                Voice.onSpeechEnd = () => setIsRecording(false);
                Voice.onSpeechResults = (e: any) => {
                    if (e.value && e.value.length > 0) {
                        setText(prev => prev + (prev.length > 0 ? ' ' : '') + e.value![0]);
                    }
                };
                Voice.onSpeechError = (e: any) => {
                    console.error('[InputArea] Voice Error:', e);
                    setIsRecording(false);
                };
            } catch (err) {
                console.error('[InputArea] Voice init error:', err);
            }
        }

        const sub = aiStore.subscribe(state => setAiState(state));
        return () => {
            sub();
            if (!isExpoGo && !isWeb && Voice) {
                try {
                    Voice.destroy().then(Voice.removeAllListeners);
                } catch (e) { }
            }
        };
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            const settings = getGeneralSettings();
            setIsCollapsed(settings.inputAreaDefaultState === 'collapsed');
        }, [])
    );

    useEffect(() => {
        if (parentNote) {
            setIsFullScreen(true);
            pan.setValue(500);
            Animated.spring(pan, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        } else {
            setIsFullScreen(false);
        }
    }, [parentNote]);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return !!(parentNote && (Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10));
            },
            onPanResponderMove: (_, gestureState) => {
                if (parentNote) {
                    const moveVal = gestureState.dy > 0 ? gestureState.dy : 0;
                    pan.setValue(moveVal);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (parentNote && (gestureState.dy > 100 || gestureState.vx > 1)) {
                    Animated.timing(pan, {
                        toValue: 800,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => {
                        onClearParent();
                    });
                } else {
                    Animated.spring(pan, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleSend = async () => {
        if (!text.trim() && images.length === 0) return;

        setLoading(true);
        try {
            const noteId = Math.random().toString(36).substring(7);
            const presetTags = getAllPresetTags().map(t => t.name);

            const newNote: MoodNote = {
                id: noteId,
                content: text,
                timestamp: new Date().toISOString(),
                moodType: 'none',
                tags: [],
                images: images,
                isFollowUp: !!parentNote,
                parentId: parentNote?.id
            };

            saveNote(newNote);
            analyzeNoteInBackground(noteId, text, presetTags);

            setText('');
            setImages([]);
            onClearParent();
            setIsFullScreen(false);
            onSuccess();
        } finally {
            setLoading(false);
        }
    };

    const handleRetryAI = async () => {
        // Re-initialize the local AI model
        try {
            const { LlamaLocalProvider } = await import('../../core/ai/providers/LlamaLocalProvider');
            await LlamaLocalProvider.initialize();
        } catch (error) {
            console.error('Failed to retry AI initialization:', error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages([...images, result.assets[0].uri]);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleVoice = async () => {
        if (isExpoGo || isWeb || !Voice) {
            Alert.alert('环境限制', '该功能目前不支持 Expo Go 或网页版环境，请发布为正式版本即可完整体验。', [{ text: '好的' }]);
            return;
        }

        if (isRecording) {
            Voice.stop().then(() => setIsRecording(false)).catch(console.error);
        } else {
            if (Platform.OS === 'android') {
                try {
                    const { PermissionsAndroid } = require('react-native');
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                        {
                            title: '麦克风权限',
                            message: '心情树洞需要麦克风权限来识别您的语音',
                            buttonNeutral: '稍后',
                            buttonNegative: '取消',
                            buttonPositive: '好的',
                        }
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        Alert.alert('权限不足', '请在系统设置中开启录音权限以使用此功能');
                        return;
                    }
                } catch (err) {
                    console.error('Permission error:', err);
                    return;
                }
            }
            Voice.start('zh-CN').catch(console.error);
        }
    };

    const renderImagePreviews = () => (
        images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {images.map((uri, index) => (
                    <View key={uri} style={styles.imagePreviewContainer}>
                        <RNImage source={{ uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageIcon} onPress={() => removeImage(index)}>
                            <XCircle size={18} color="#FFF" fill="rgba(0,0,0,0.6)" />
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        )
    );

    const renderInputContent = (full: boolean) => (
        <View style={[styles.inputWrapper, full && styles.fullInputWrapper]}>
            <View style={[
                styles.contentPanel,
                full && { flex: 1 },
                theme.isHandDrawn ? styles.handDrawnPanel : styles.minimalistPanel,
                { borderColor: theme.colors.divider }
            ]}>
                {!full && !parentNote && (
                    <TouchableOpacity
                        style={styles.collapseBtn}
                        onPress={() => setIsCollapsed(true)}
                    >
                        <ChevronDown size={20} color={theme.colors.secondaryText} />
                    </TouchableOpacity>
                )}


                {parentNote && (
                    <View style={[styles.parentIndicator, { backgroundColor: theme.colors.divider + '30' }]}>
                        <Text style={[styles.parentText, { color: theme.colors.accent }]} numberOfLines={1}>回复: {parentNote.content}</Text>
                        <TouchableOpacity onPress={onClearParent}>
                            <X size={14} color={theme.colors.secondaryText} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={full ? { flex: 1 } : null}>
                    <TextInput
                        style={[
                            styles.input,
                            { color: theme.colors.text },
                            full && styles.fullInput,
                            theme.typography.body
                        ]}
                        placeholder={parentNote ? "继续记录点什么..." : "简单记下此时此刻的心情..."}
                        placeholderTextColor={theme.colors.secondaryText}
                        multiline={true}
                        value={text}
                        onChangeText={setText}
                        autoFocus={full}
                        onFocus={() => { if (!full) setIsFullScreen(true); }}
                    />
                </View>

                {renderImagePreviews()}

                <View style={[styles.actionRow, { borderTopColor: theme.colors.divider + '30' }]}>
                    <View style={styles.leftActions}>
                        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                            <ImageIcon size={22} color={theme.colors.secondaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, isRecording && { backgroundColor: '#FFEFEE' }]}
                            onPress={handleVoice}
                        >
                            <Mic size={22} color={isRecording ? '#FF3B30' : theme.colors.secondaryText} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: (text.trim() || images.length > 0) ? theme.colors.accent : theme.colors.divider }
                        ]}
                        onPress={handleSend}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Send size={18} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, isCollapsed && !parentNote && !isFullScreen && styles.collapsedContainer]}>
            {isCollapsed && !parentNote && !isFullScreen ? (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.colors.accent }]}
                    onPress={() => setIsFullScreen(true)}
                    activeOpacity={0.8}
                >
                    <Plus size={28} color="#FFF" />
                </TouchableOpacity>
            ) : !isFullScreen ? renderInputContent(false) : (
                <RNModal visible={isFullScreen} animationType="fade" transparent={true}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalOverlay}
                    >
                        <Animated.View
                            {...(parentNote ? panResponder.panHandlers : {})}
                            style={[
                                styles.fullScreenWrapper,
                                {
                                    backgroundColor: theme.colors.background,
                                    transform: [{ translateY: pan }]
                                }
                            ]}
                        >
                            <SafeAreaView style={{ flex: 1 }}>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity style={styles.closeHandle} onPress={() => {
                                        setIsFullScreen(false);
                                        onClearParent();
                                        // Respect inputAreaDefaultState setting
                                        const settings = getGeneralSettings();
                                        setIsCollapsed(settings.inputAreaDefaultState === 'collapsed');
                                    }}>
                                        <ChevronDown size={32} color={theme.colors.secondaryText} />
                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        style={styles.aiStatusBadge}
                                        onPress={handleRetryAI}
                                        activeOpacity={aiState.status === 'ERROR' ? 0.7 : 1}
                                    >
                                        <View style={[styles.statusDot, { backgroundColor: aiState.status === 'READY' ? '#4CD964' : aiState.status === 'ERROR' ? '#FF3B30' : '#FFCC00' }]} />
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {aiState.status === 'BUSY' ? (
                                                <RainbowText
                                                    text="解析中..."
                                                    style={StyleSheet.flatten([styles.statusText, theme.isHandDrawn && theme.typography.caption, theme.isHandDrawn && { fontSize: 11 }])}
                                                />
                                            ) : (
                                                <Text style={[styles.statusText, { color: theme.colors.secondaryText }]}>
                                                    {aiState.status === 'DOWNLOADING' ? `AI 下载中 ${isNaN(aiState.progress) || aiState.progress === undefined ? 0 : Math.round(aiState.progress * 100)}%` :
                                                        aiState.status === 'ERROR' ? 'AI 离线 (点击重试)' : '本地 AI 已就绪'}
                                                </Text>
                                            )}
                                        </View>
                                        {aiState.status === 'ERROR' && <RefreshCcw size={10} color={theme.colors.secondaryText} style={{ marginLeft: 6 }} />}
                                    </TouchableOpacity>
                                </View>
                                {renderInputContent(true)}
                            </SafeAreaView>
                        </Animated.View>
                    </KeyboardAvoidingView>
                </RNModal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    collapsedContainer: {
        position: 'absolute',
        bottom: 0,
        height: 100, // Enough height to contain the FAB
    },
    inputWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 12, // User requested spacing for better separation
        boxShadow: '0px -5px 10px rgba(0, 0, 0, 0.1)',
    },
    fullInputWrapper: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentPanel: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        // Shadow on the top edge for separation from timeline
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    handDrawnPanel: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        backgroundColor: '#FFFCF7', // Slightly warm white for hand-drawn feel
    },
    minimalistPanel: {
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    parentIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        marginBottom: 0, // Integrated into the panel
    },
    parentText: {
        flex: 1,
        fontSize: 13,
    },
    input: {
        padding: 16,
        minHeight: 100, // Taller by default as per reference
        textAlignVertical: 'top',
    },
    fullInput: {
        flex: 1,
        fontSize: 18,
    },
    imageScroll: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    imagePreviewContainer: {
        marginRight: 12,
        position: 'relative',
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImageIcon: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 1,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        zIndex: 2,
    },
    fab: {
        position: 'absolute',
        bottom: 30, // Positioned above the very bottom
        alignSelf: 'center',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    collapseBtn: {
        position: 'absolute',
        right: 12,
        top: 12,
        zIndex: 10,
        padding: 4,
    },
    leftActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    fullScreenWrapper: {
        flex: 1,
        marginTop: 60,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    closeHandle: {
        padding: 4,
    },
    aiStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
