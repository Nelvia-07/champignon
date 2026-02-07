import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../core/theme';
import { Trash2, Tag as TagIcon, X } from 'lucide-react-native';

interface Props {
    selectedCount: number;
    onDelete: () => void;
    onTag: () => void;
    onCancel: () => void;
}

export const MultiSelectToolbar = ({ selectedCount, onDelete, onTag, onCancel }: Props) => {
    const { theme } = useTheme();

    if (selectedCount === 0) return null;

    return (
        <View style={styles.wrapper}>
            <View style={[styles.container, { backgroundColor: '#F8F6F2' }]}>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                        <X size={20} color="#999" />
                    </TouchableOpacity>

                    <Text style={[styles.countText, { color: theme.colors.text }]}>已选 {selectedCount} 项</Text>

                    <View style={styles.right}>
                        <TouchableOpacity style={styles.actionButton} onPress={onTag}>
                            <TagIcon size={20} color={theme.colors.accent} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
                            <Trash2 size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    container: {
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cancelBtn: {
        padding: 5,
    },
    countText: {
        fontSize: 14,
        fontWeight: '600',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
