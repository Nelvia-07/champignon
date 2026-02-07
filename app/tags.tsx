import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/core/theme';
import { getAllPresetTags, addPresetTag, deletePresetTag } from '../src/core/storage';
import { ChevronLeft, Plus, Trash2, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Tag } from '../src/core/models';
import { getTagStyles } from '../src/core/utils';

const TAG_COLORS = ['#FFD580', '#B0DAFF', '#C1E1C1', '#D4C1EC', '#FFABAB', '#F5F5F5'];

export default function TagsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [tags, setTags] = useState<Tag[]>([]);
    const [newTag, setNewTag] = useState('');
    const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = () => {
        const data = getAllPresetTags();
        setTags(data);
    };

    const handleAddTag = () => {
        if (newTag.trim()) {
            addPresetTag(newTag.trim(), selectedColor);
            setNewTag('');
            loadTags();
        }
    };

    const handleDeleteTag = (tagName: string) => {
        deletePresetTag(tagName);
        loadTags();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>标签管理</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.inputSection}>
                <View style={styles.colorPicker}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {TAG_COLORS.map(color => (
                            <TouchableOpacity
                                key={color}
                                style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.selectedColor]}
                                onPress={() => setSelectedColor(color)}
                            >
                                {selectedColor === color && <Check size={14} color="#555" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <View style={styles.inputRow}>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.colors.cardBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.divider
                        }]}
                        placeholder="输入新标签..."
                        placeholderTextColor={theme.colors.secondaryText}
                        value={newTag}
                        onChangeText={setNewTag}
                    />
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.accent }]} onPress={handleAddTag}>
                        <Plus size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={tags}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const tagStyle = getTagStyles(item.color || '#F5F5F5');
                    return (
                        <View style={[styles.tagItem, { backgroundColor: tagStyle.backgroundColor, borderColor: 'transparent' }]}>
                            <Text style={[styles.tagText, { color: tagStyle.color }]}># {item.name}</Text>
                            <TouchableOpacity onPress={() => handleDeleteTag(item.name)}>
                                <Trash2 size={18} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />
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
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    backBtn: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputSection: {
        padding: 20,
        gap: 15,
    },
    colorPicker: {
        flexDirection: 'row',
        height: 30,
    },
    colorCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    selectedColor: {
        borderWidth: 2,
        borderColor: '#333',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
    },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: 20,
    },
    tagItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
