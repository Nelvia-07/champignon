import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl, Platform, Image, Dimensions } from 'react-native';
import { useTheme } from '../../core/theme';
import { MoodNote, GroupedNotes } from '../../core/models';
import { NoteCard } from '../components/NoteCard';
import { format, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Props {
    notes: MoodNote[];
    isMultiSelect: boolean;
    selectedIds: string[];
    onSelect: (id: string) => void;
    onRefresh: () => void;
    onSetFollowUp: (note: MoodNote) => void;
}

export const TimelineView = ({ notes, isMultiSelect, selectedIds, onSelect, onRefresh, onSetFollowUp }: Props) => {
    const { theme } = useTheme();
    const [refreshing, setRefreshing] = React.useState(false);

    const groupNotesByDate = (notesList: MoodNote[]): GroupedNotes => {
        return notesList.reduce((acc: GroupedNotes, note) => {
            const dateKey = format(new Date(note.timestamp), 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(note);
            return acc;
        }, {});
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const getDateHeader = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return '今天';
        if (isYesterday(date)) return '昨天';
        return format(date, 'M月d日', { locale: zhCN });
    };

    const grouped = groupNotesByDate(notes.filter(n => !n.parentId));
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.accent} />}
            >
                {sortedDates.map(date => (
                    <View key={date} style={styles.dateGroup}>
                        <View style={styles.dateHeaderContainer}>
                            <Text style={[
                                styles.dateHeader,
                                { color: theme.colors.secondaryText },
                                theme.isHandDrawn && theme.typography.title,
                                theme.isHandDrawn && { fontSize: 18, fontWeight: '400', opacity: 0.8 }
                            ]}>
                                {getDateHeader(date)}
                            </Text>
                            <View style={[styles.headerLine, { backgroundColor: theme.colors.divider, opacity: 0.3 }]} />
                        </View>
                        {grouped[date].map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                allNotes={notes}
                                isMultiSelect={isMultiSelect}
                                isSelected={selectedIds.includes(note.id)}
                                onSelect={onSelect}
                                onRefresh={onRefresh}
                                onSetFollowUp={onSetFollowUp}
                            />
                        ))}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.bgContainer} pointerEvents="none">
                <Image
                    source={require('../../../assets/mushroom.png')}
                    style={styles.bgMushroom}
                    resizeMode="contain"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    dateGroup: {
        marginBottom: 12,
    },
    dateHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 12,
    },
    dateHeader: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerLine: {
        flex: 1,
        height: 1,
    },
    bgContainer: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        width: Dimensions.get('window').height / 4,
        height: Dimensions.get('window').height / 4,
        opacity: 0.5,
        zIndex: -1,
    },
    bgMushroom: {
        width: '100%',
        height: '100%',
    },
});
