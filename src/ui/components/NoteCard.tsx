import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image as RNImage, Modal as RNModal, TextInput, Animated, PanResponder } from 'react-native';
import { useTheme } from '../../core/theme';
import { MoreHorizontal, Trash2, Tag, ChevronDown, ChevronUp, Plus, MessageCircle, Smile, Pencil, Sparkles, Copy } from 'lucide-react-native';
import { MoodNote, MoodType, Tag as TagModel } from '../../core/models';
import { updateNoteContent, deleteNotes, updateNoteTags, getAllPresetTags, updateNoteMood, updateNoteMoodAndTags } from '../../core/storage';
import { format } from 'date-fns';
import { Alert, Platform } from 'react-native';
import { MoodIcon } from './MoodIcon';
import { getTagStyles, lightenColor, getMoodColor } from '../../core/utils';
import { aiService } from '../../core/ai';
import { aiStore } from '../../core/ai/store';
import * as Clipboard from 'expo-clipboard';
import { RainbowText } from './RainbowText';

interface Props {
    note: MoodNote;
    allNotes: MoodNote[];
    isSelected: boolean;
    isMultiSelect: boolean;
    onSelect: (id: string) => void;
    onRefresh: () => void;
    onSetFollowUp: (note: MoodNote) => void;
}

export const NoteCard = ({ note, allNotes, isSelected, isMultiSelect, onSelect, onRefresh, onSetFollowUp }: Props) => {
    const { theme } = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [canExpand, setCanExpand] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0, showUpward: false });

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(note.content);
    const [isTagSelecting, setIsTagSelecting] = useState(false);
    const [presetTags, setPresetTags] = useState<TagModel[]>([]);
    const [isMoodSelecting, setIsMoodSelecting] = useState(false);
    const [followUpsExpanded, setFollowUpsExpanded] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [aiState, setAiState] = useState(aiStore.getState());

    const moreBtnRef = useRef<View>(null);
    const pan = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return (Math.abs(gestureState.dy) > 10 || Math.abs(gestureState.dx) > 10);
            },
            onPanResponderMove: (_, gestureState) => {
                const moveVal = gestureState.dy > 0 ? gestureState.dy : 0;
                pan.setValue(moveVal);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100 || gestureState.vx > 1) {
                    Animated.timing(pan, {
                        toValue: 800,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => setIsEditing(false));
                } else {
                    Animated.spring(pan, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const followUps = allNotes.filter(n => n.parentId === note.id);

    const onTextLayout = useCallback((e: any) => {
        if (e.nativeEvent.lines.length > 3) {
            setCanExpand(true);
        }
    }, []);

    useEffect(() => {
        if (note.content && note.content.length > 40) {
            setCanExpand(true);
        }
    }, [note.content]);

    useEffect(() => {
        setPresetTags(getAllPresetTags());
    }, []);

    useEffect(() => {
        const sub = aiStore.subscribe(state => setAiState(state));
        return () => sub();
    }, []);

    useEffect(() => {
        if (isEditing) {
            pan.setValue(500);
            Animated.spring(pan, {
                toValue: 0,
                useNativeDriver: true,
                friction: 8,
            }).start();
        }
    }, [isEditing, pan]);

    const handleDelete = () => {
        Alert.alert('确定删除吗?', '此操作无法撤销', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: () => {
                    deleteNotes([note.id]);
                    onRefresh();
                }
            }
        ]);
    };

    const handleTagSelect = (tagName: string) => {
        const currentTags = note.tags || [];
        const newTags = currentTags.includes(tagName)
            ? currentTags.filter(t => t !== tagName)
            : [...currentTags, tagName];
        updateNoteTags([note.id], newTags);
        onRefresh();
    };

    const handleOpenMenu = () => {
        moreBtnRef.current?.measure((x, y, width, height, pageX, pageY) => {
            // Get screen height to determine if menu should show upward
            const screenHeight = require('react-native').Dimensions.get('window').height;
            const menuHeight = 350; // Approximate menu height
            const showUpward = pageY + menuHeight > screenHeight - 50;

            setMenuLayout({
                x: pageX,
                y: showUpward ? pageY - menuHeight : pageY + height,
                width,
                showUpward
            });
            setIsMenuVisible(true);
        });
    };


    const handleAIAnalyze = async () => {
        setIsMenuVisible(false);
        try {
            aiStore.setState({ analyzingNoteId: note.id });
            // Get current preset tags for context
            const presetTagNames = presetTags.map(t => t.name);
            const result = await aiService.analyze(note.content, presetTagNames);
            if (result) {
                updateNoteMoodAndTags(note.id, result.mood as MoodType, result.tags);
                onRefresh(); // Refresh UI to show new mood and tags
            }
        } catch (error) {
            console.error('[NoteCard] AI Analysis failed:', error);
            Alert.alert('AI 分析失败', error instanceof Error ? error.message : '未知错误');
        } finally {
            aiStore.setState({ analyzingNoteId: null });
        }
    };

    const handleCopy = async () => {
        setIsMenuVisible(false);
        await Clipboard.setStringAsync(note.content);
        // Optional: show a toast or alert, but usually silent is fine for a quick copy
    };

    // Calculate background color for HandDrawn mode
    const getCardStyle = () => {
        if (!theme.isHandDrawn) {
            return {
                backgroundColor: theme.colors.cardBackground,
                borderColor: isSelected ? theme.colors.accent : '#F0EDE8',
                borderWidth: isSelected ? 2.0 : 0,
            };
        }

        // HandDrawn Logic: Determine mood color OR first tag color
        let baseColor = '#FFFFFF';
        let hasColor = false;

        // Priority 1: Mood
        if (note.moodType && note.moodType !== 'none') {
            baseColor = getMoodColor(note.moodType);
            hasColor = true;
        }
        // Priority 2: Tags
        else if (note.tags && note.tags.length > 0) {
            const firstTag = presetTags.find(t => t.name === note.tags[0]);
            if (firstTag && firstTag.color) {
                baseColor = firstTag.color;
                hasColor = true;
            }
        }

        return {
            backgroundColor: hasColor ? lightenColor(baseColor, 0.1) : theme.colors.cardBackground,

            borderColor: isSelected ? theme.colors.accent : 'transparent',
            borderWidth: isSelected ? 2.0 : 0, // No border for HandDrawn as per user request
            borderStyle: 'solid' as const,
        };
    };

    const cardStyle = getCardStyle();

    return (
        <View style={styles.outerContainer}>
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => !isMultiSelect && handleOpenMenu()}
                onPress={() => isMultiSelect && onSelect(note.id)}
                style={[styles.card, cardStyle]}
            >
                <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[
                            styles.timeLabel,
                            {
                                color: theme.colors.secondaryText,
                                fontFamily: theme.isHandDrawn ? 'ComicNeue' : (Platform.OS === 'ios' ? 'Menlo' : 'monospace'),
                                fontSize: 13,
                                fontWeight: '400',
                                opacity: 0.7,
                            }
                        ]}>
                            {format(new Date(note.timestamp), 'HH:mm')}
                        </Text>
                        {aiState.status === 'BUSY' && aiState.analyzingNoteId === note.id && (
                            <View style={{ marginLeft: 4 }}>
                                <RainbowText
                                    text="· AI 分析中..."
                                    style={{ fontSize: 9, letterSpacing: 0.3 }}
                                />
                            </View>
                        )}
                        {note.moodType !== 'none' && (
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, opacity: 0.8 }}>
                                · {note.moodType === 'happy' ? '开心' : note.moodType === 'sad' ? '难过' : '焦虑'}
                            </Text>
                        )}
                    </View>
                    {!isMultiSelect && (
                        <TouchableOpacity
                            ref={moreBtnRef}
                            onPress={(e) => { e.stopPropagation(); handleOpenMenu(); }}
                            style={styles.moreIconBtn}
                        >
                            <MoreHorizontal size={18} color={theme.colors.secondaryText} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.contentSection}>
                    <View style={[styles.contentWithMood, note.moodType === 'none' && { gap: 0 }]}>
                        {note.moodType !== 'none' && (
                            <TouchableOpacity
                                style={styles.moodBadge}
                                onPress={() => !isMultiSelect && setIsMoodSelecting(true)}
                            >
                                <MoodIcon mood={note.moodType} size={36} />
                            </TouchableOpacity>
                        )}
                        <Text
                            style={[
                                styles.content,
                                { color: theme.colors.text },
                                theme.typography.body
                            ]}
                            numberOfLines={expanded ? undefined : 3}
                            onTextLayout={onTextLayout}
                        >
                            {note.content}
                        </Text>
                    </View>
                </View>

                {note.tags && note.tags.length > 0 && (
                    <View style={styles.tagContainer}>
                        {note.tags.map(tagName => {
                            const tagInfo = presetTags.find(t => t.name === tagName);
                            const baseColor = tagInfo?.color || '#9E9E9E';
                            const tagStyle = getTagStyles(baseColor);
                            return (
                                <View key={tagName} style={[styles.tag, { backgroundColor: tagStyle.backgroundColor }]}>
                                    <Text style={[styles.tagText, { color: tagStyle.color }]}># {tagName}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                {note.images && note.images.length > 0 && (
                    <View style={styles.cardImageContainer}>
                        {note.images.slice(0, 3).map((uri, idx) => (
                            <TouchableOpacity key={idx} onPress={(e) => { e.stopPropagation(); setPreviewImage(uri); }}>
                                <RNImage source={{ uri }} style={styles.cardImage} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {followUps.length > 0 && (
                    <View style={[styles.headerLine, { backgroundColor: theme.colors.divider, opacity: theme.isHandDrawn ? 0.3 : 0.5 }]} />
                )}

                {followUps.length > 0 && (
                    <View style={styles.followUpsWrapper}>
                        <TouchableOpacity
                            style={styles.followUpHeader}
                            onPress={() => setFollowUpsExpanded(!followUpsExpanded)}
                        >
                            <ChevronDown
                                size={14}
                                color={theme.colors.secondaryText}
                                style={{ transform: [{ rotate: followUpsExpanded ? '0deg' : '-90deg' }] }}
                            />
                            <Text style={[styles.followUpHeaderTitle, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.caption]}>
                                后续 {followUps.length}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.followUpTimeline}>
                            {(followUpsExpanded ? followUps : followUps.slice(0, 1)).map((f, index) => (
                                <View key={f.id} style={styles.followUpRow}>
                                    <View style={[styles.verticalDashLine, { borderColor: theme.colors.divider }]} />
                                    <TouchableOpacity
                                        style={styles.followUpContentBox}
                                        onPress={() => {
                                            setEditingNoteId(f.id);
                                            setEditContent(f.content);
                                            setIsEditing(true);
                                        }}
                                    >
                                        <Text style={[styles.followUpTime, { color: theme.colors.secondaryText }, theme.isHandDrawn && theme.typography.number, theme.isHandDrawn && { fontSize: 12 }]}>
                                            {format(new Date(f.timestamp), 'MM-dd HH:mm')}
                                        </Text>
                                        <Text
                                            style={[styles.followUpContent, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body, theme.isHandDrawn && { fontSize: 14, lineHeight: 20 }]}
                                            numberOfLines={followUpsExpanded ? undefined : 1}
                                        >
                                            {f.content}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {canExpand && (
                    <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.expandBtn}>
                        {expanded ? (
                            <View style={styles.expandTextContainer}>
                                <Text style={{ color: theme.colors.secondaryText, fontSize: 12 }}>收起全文</Text>
                                <ChevronUp size={14} color={theme.colors.secondaryText} />
                            </View>
                        ) : (
                            <View style={styles.expandTextContainer}>
                                <Text style={{ color: theme.colors.accent, fontSize: 13 }}>展开全文</Text>
                                <ChevronDown size={14} color={theme.colors.accent} />
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            <RNModal visible={isEditing} transparent={true} animationType="none" onRequestClose={() => setIsEditing(false)} statusBarTranslucent={true}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={() => { setIsEditing(false); setEditingNoteId(null); }} />
                    <Animated.View
                        style={[
                            styles.halfModalContainer,
                            {
                                backgroundColor: theme.colors.cardBackground,
                                transform: [{ translateY: pan }]
                            }
                        ]}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.modalHandle} />
                        <View style={styles.editHeader}>
                            <TouchableOpacity onPress={() => { setIsEditing(false); setEditingNoteId(null); }}>
                                <Text style={{ color: theme.colors.secondaryText }}>取消</Text>
                            </TouchableOpacity>
                            <Text style={[styles.editTitle, { color: theme.colors.text }]}>编辑记录</Text>
                            <TouchableOpacity onPress={async () => {
                                await updateNoteContent(editingNoteId || note.id, editContent);
                                setIsEditing(false);
                                setEditingNoteId(null);
                                onRefresh();
                            }}>
                                <Text style={{ color: theme.colors.accent, fontWeight: 'bold' }}>完成</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.editInput, { color: theme.colors.text }]}
                            multiline
                            value={editContent}
                            onChangeText={setEditContent}
                            autoFocus
                        />
                    </Animated.View>
                </View>
            </RNModal>

            <RNModal visible={isMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setIsMenuVisible(false)} statusBarTranslucent={true}>

                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
                    <View style={[
                        styles.menuContent,
                        {
                            top: Math.max(50, Math.min(menuLayout.y, require('react-native').Dimensions.get('window').height - 400)),
                            left: Math.max(10, menuLayout.x - 120),
                            backgroundColor: theme.colors.cardBackground
                        }
                    ]}>

                        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); onSetFollowUp(note); }}>
                            <MessageCircle size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>添加后续</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={handleAIAnalyze}>
                            <Sparkles size={18} color={theme.colors.accent} />
                            <Text style={[styles.menuItemText, { color: theme.colors.accent }]}>AI 重新分析</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
                            <Copy size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>复制内容</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setIsMoodSelecting(true); }}>
                            <Smile size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>修改心情</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); setIsTagSelecting(true); }}>
                            <Tag size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>修改标签</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setIsMenuVisible(false);
                            setEditingNoteId(note.id);
                            setEditContent(note.content);
                            setIsEditing(true);
                        }}>
                            <Pencil size={18} color={theme.colors.text} />
                            <Text style={[styles.menuItemText, { color: theme.colors.text }]}>编辑记录</Text>
                        </TouchableOpacity>
                        <View style={[styles.menuDivider, { backgroundColor: theme.colors.divider }]} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setIsMenuVisible(false); handleDelete(); }}>
                            <Trash2 size={18} color="#FF6B6B" />
                            <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>删除</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </RNModal>

            <RNModal visible={isTagSelecting} transparent={true} animationType="fade" onRequestClose={() => setIsTagSelecting(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={() => setIsTagSelecting(false)} />
                    <View style={[styles.tagModalContent, { backgroundColor: theme.colors.cardBackground }]}>
                        <Text style={[styles.tagModalTitle, { color: theme.colors.text }]}>管理标签</Text>
                        <View style={styles.tagGrid}>
                            {presetTags.map(tag => {
                                const isSelected = note.tags?.includes(tag.name);
                                return (
                                    <TouchableOpacity
                                        key={tag.name}
                                        style={[
                                            styles.tagOption,
                                            {
                                                backgroundColor: isSelected ? tag.color : theme.colors.background,
                                                borderColor: tag.color,
                                                borderWidth: 1
                                            }
                                        ]}
                                        onPress={() => handleTagSelect(tag.name)}
                                    >
                                        <Text style={{
                                            color: isSelected ? 'white' : theme.colors.text,
                                            fontSize: 12,
                                            fontWeight: '500'
                                        }}>
                                            {tag.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <TouchableOpacity
                            style={[styles.tagDoneBtn, { backgroundColor: theme.colors.accent }]}
                            onPress={() => setIsTagSelecting(false)}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>完成</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </RNModal>

            <RNModal visible={isMoodSelecting} transparent={true} animationType="fade" onRequestClose={() => setIsMoodSelecting(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={() => setIsMoodSelecting(false)} />
                    <View style={[styles.tagModalContent, { backgroundColor: theme.colors.cardBackground, height: 250 }]}>
                        <Text style={[styles.tagModalTitle, { color: theme.colors.text }]}>调整心情</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
                            {(['happy', 'anxious', 'sad', 'none'] as MoodType[]).map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[
                                        styles.moodOption,
                                        note.moodType === m && { backgroundColor: theme.isHandDrawn ? '#F0EDE8' : '#F0F0F0', borderRadius: 15, padding: 5 }
                                    ]}
                                    onPress={() => {
                                        updateNoteMood(note.id, m);
                                        setIsMoodSelecting(false);
                                        onRefresh();
                                    }}
                                >
                                    <MoodIcon mood={m} size={50} />
                                    <View style={{ height: 50, width: 50, justifyContent: 'center', alignItems: 'center', display: m === 'none' ? 'flex' : 'none' }}>
                                        <Text style={{ fontSize: 24, color: '#999' }}>∅</Text>
                                    </View>
                                    <Text style={{ textAlign: 'center', marginTop: 5, color: theme.colors.secondaryText, fontSize: 12 }}>
                                        {m === 'happy' ? '开心' : m === 'sad' ? '难过' : m === 'anxious' ? '焦虑' : '无情绪'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </RNModal>
        </View >
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        marginBottom: 12,
    },
    card: {
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timeLabel: {
        fontSize: 12,
    },
    moreIconBtn: {
        padding: 5,
    },
    contentSection: {
        marginBottom: 8,
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
    },
    contentWithMood: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    moodBadge: {
        marginTop: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginVertical: 6,
        alignItems: 'center',
    },
    tag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    addTagSmallBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    cardImageContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 5,
    },
    cardImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
    },
    headerLine: {
        height: 1,
        width: '100%',
        marginVertical: 8,
        borderStyle: 'dashed',
    },
    followUpsWrapper: {
        marginTop: 5,
    },
    followUpHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    followUpHeaderTitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    followUpTimeline: {
        paddingLeft: 5,
    },
    followUpRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 12,
    },
    verticalDashLine: {
        width: 2,
        height: '100%',
        borderLeftWidth: 1.5,
        borderStyle: 'dashed',
        opacity: 0.5,
    },
    followUpContentBox: {
        flex: 1,
    },
    followUpTime: {
        fontSize: 11,
        marginBottom: 4,
        opacity: 0.7,
    },
    followUpContent: {
        fontSize: 14,
        lineHeight: 20,
    },
    expandBtn: {
        marginTop: 10,
        alignItems: 'flex-end',
    },
    expandTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    overlayClose: {
        flex: 1,
    },
    halfModalContainer: {
        height: '80%',
        width: '100%',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 20,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#E0E0E0',
        borderRadius: 2.5,
        alignSelf: 'center',
        marginBottom: 10,
    },
    editHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        marginBottom: 10,
    },
    editTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    editInput: {
        flex: 1,
        fontSize: 16,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    menuContent: {
        position: 'absolute',
        width: 150,
        borderRadius: 15,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    menuItemText: {
        fontSize: 14,
        fontWeight: '500',
    },
    menuDivider: {
        height: 1,
        marginVertical: 4,
        opacity: 0.5,
    },
    tagModalContent: {
        padding: 20,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        maxHeight: '60%',
    },
    tagModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    tagOption: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 5,
    },
    tagDoneBtn: {
        marginTop: 25,
        paddingVertical: 12,
        borderRadius: 15,
        alignItems: 'center',
    },
    moodOption: {
        alignItems: 'center',
        padding: 10,
    }
});
