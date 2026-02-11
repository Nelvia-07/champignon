import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ImageBackground, Modal, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/core/theme';
import { Menu, Calendar, CheckSquare, LayoutList, ChevronDown } from 'lucide-react-native';
import { InputArea } from '../src/ui/components/InputArea';
import { TimelineView } from '../src/ui/views/TimelineView';
import { CalendarView } from '../src/ui/views/CalendarView';
import { MultiSelectToolbar } from '../src/ui/components/MultiSelectToolbar';
import { DrawerMenu } from '../src/ui/components/DrawerMenu';
import { MoodNote } from '../src/core/models';
import { getAllNotes, deleteNotes, updateNoteTags, initDatabase } from '../src/core/storage';

export default function Index() {
    const { theme } = useTheme();
    const [selectedViewMode, setSelectedViewMode] = useState<'timeline' | 'calendar'>('timeline');
    const [isMultiSelect, setIsMultiSelect] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [notes, setNotes] = useState<MoodNote[]>([]);
    const [parentNote, setParentNote] = useState<MoodNote | null>(null);
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

    const fetchNotes = () => {
        setNotes(getAllNotes());
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleDelete = () => {
        Alert.alert('确定删除吗？', `将删除选中的 ${selectedIds.length} 项记录`, [
            { text: '取消', style: 'cancel' },
            {
                text: '确定删除',
                style: 'destructive',
                onPress: () => {
                    deleteNotes(selectedIds);
                    setSelectedIds([]);
                    setIsMultiSelect(false);
                    fetchNotes();
                }
            }
        ]);
    };

    const handleBatchTag = () => {
        Alert.prompt('批量打标签', '输入要覆盖的新标签（多个用逗号隔开）', (text) => {
            if (text) {
                const newTags = text.split(',').map(t => t.trim());
                updateNoteTags(selectedIds, newTags);
                setSelectedIds([]);
                setIsMultiSelect(false);
                fetchNotes();
            }
        });
    };

    const handleCancelSelect = () => {
        setSelectedIds([]);
        setIsMultiSelect(false);
    };

    const drawerAnim = React.useRef(new Animated.Value(-300)).current;

    useEffect(() => {
        if (isDrawerOpen) {
            drawerAnim.setValue(-300);
            Animated.timing(drawerAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [isDrawerOpen]);

    const content = (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.divider }]}>
                {/* Left: Menu Button */}
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setIsDrawerOpen(true)}
                >
                    <Menu color={theme.colors.text} size={22} />
                </TouchableOpacity>

                {/* Center: Title with Dropdown */}
                <TouchableOpacity
                    style={styles.titleDropdownTrigger}
                    onPress={() => setIsViewDropdownOpen(true)}
                >
                    <Text style={[
                        styles.title,
                        { color: theme.colors.text },
                        theme.isHandDrawn && theme.typography.title,
                        { fontFamily: 'DancingScript_700Bold', fontSize: 26, fontWeight: '400', letterSpacing: 0.5 }
                    ]}>
                        Champignon
                    </Text>
                    <ChevronDown size={16} color={theme.colors.secondaryText} style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                {/* Right: Action Button */}
                {selectedViewMode === 'timeline' ? (
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            setIsMultiSelect(!isMultiSelect);
                            if (isMultiSelect) setSelectedIds([]);
                        }}
                    >
                        <CheckSquare color={isMultiSelect ? theme.colors.accent : theme.colors.text} size={22} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.headerButton} />
                )}
            </View>

            {/* View Dropdown Modal */}
            <Modal visible={isViewDropdownOpen} transparent={true} animationType="fade" onRequestClose={() => setIsViewDropdownOpen(false)}>
                <TouchableOpacity
                    style={styles.dropdownOverlay}
                    activeOpacity={1}
                    onPress={() => setIsViewDropdownOpen(false)}
                >
                    <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.cardBackground }]}>
                        <TouchableOpacity
                            style={[styles.dropdownItem, selectedViewMode === 'timeline' && { backgroundColor: theme.colors.divider + '50' }]}
                            onPress={() => { setSelectedViewMode('timeline'); setIsViewDropdownOpen(false); }}
                        >
                            <LayoutList size={20} color={selectedViewMode === 'timeline' ? theme.colors.accent : theme.colors.text} />
                            <Text style={[styles.dropdownItemText, { color: selectedViewMode === 'timeline' ? theme.colors.accent : theme.colors.text }]}>时间轴</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.dropdownItem, selectedViewMode === 'calendar' && { backgroundColor: theme.colors.divider + '50' }]}
                            onPress={() => { setSelectedViewMode('calendar'); setIsViewDropdownOpen(false); }}
                        >
                            <Calendar size={20} color={selectedViewMode === 'calendar' ? theme.colors.accent : theme.colors.text} />
                            <Text style={[styles.dropdownItemText, { color: selectedViewMode === 'calendar' ? theme.colors.accent : theme.colors.text }]}>日历</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <View style={styles.content}>
                {selectedViewMode === 'timeline' ? (
                    <TimelineView
                        notes={filterTag ? notes.filter(n => n.tags?.includes(filterTag)) : notes}
                        isMultiSelect={isMultiSelect}
                        selectedIds={selectedIds}
                        onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                        onRefresh={fetchNotes}
                        onSetFollowUp={setParentNote}
                    />
                ) : (
                    <CalendarView notes={filterTag ? notes.filter(n => n.tags?.includes(filterTag)) : notes} />
                )}
            </View>

            {/* Input Area or Toolbar */}
            {selectedViewMode === 'timeline' && (
                !isMultiSelect ? (
                    <InputArea
                        parentNote={parentNote}
                        onClearParent={() => setParentNote(null)}
                        onSuccess={fetchNotes}
                    />
                ) : (
                    <MultiSelectToolbar
                        selectedCount={selectedIds.length}
                        onDelete={handleDelete}
                        onTag={handleBatchTag}
                        onCancel={handleCancelSelect}
                    />
                )
            )}

            {/* Drawer Modal - Slide from Left */}
            <Modal transparent={true} visible={isDrawerOpen} animationType="fade" onRequestClose={() => setIsDrawerOpen(false)} statusBarTranslucent={true}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.overlayClose} activeOpacity={1} onPress={() => setIsDrawerOpen(false)} />
                    <Animated.View style={[
                        styles.drawerWrapper,
                        {
                            backgroundColor: theme.colors.cardBackground, // White
                            transform: [{ translateX: drawerAnim }]
                        }
                    ]}>
                        <DrawerMenu
                            onClose={() => setIsDrawerOpen(false)}
                            currentFilter={filterTag}
                            onFilterChange={setFilterTag}
                        />
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );

    return <View style={[styles.fullScreen, { backgroundColor: theme.colors.background }]}>{content}</View>;
}

const styles = StyleSheet.create({
    fullScreen: { flex: 1 },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    headerButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleDropdownTrigger: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    title: {
        fontSize: 18,
    },
    dropdownOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 120,
    },
    dropdownMenu: {
        borderRadius: 12,
        paddingVertical: 8,
        minWidth: 140,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    dropdownItemText: {
        fontSize: 16,
    },
    content: { flex: 1 },
    modalOverlay: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    overlayClose: {
        flex: 1,
    },
    drawerWrapper: {
        width: '75%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
});

