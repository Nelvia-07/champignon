import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';

import { useTheme } from '../../core/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MoodNote, MoodType, Tag } from '../../core/models';

import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { MoodIcon } from '../components/MoodIcon';
import { Sparkles, Send, ChevronDown } from 'lucide-react-native';

import { aiService } from '../../core/ai';
import { getAllPresetTags } from '../../core/storage';
import { getTagStyles } from '../../core/utils';


LocaleConfig.locales['zh'] = {
    monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
    today: '今天'
};
LocaleConfig.defaultLocale = 'zh';

interface Props {
    notes: MoodNote[];
}

const MOOD_LABELS: Record<MoodType, string> = {
    happy: '开心',
    sad: '难过',
    anxious: '焦虑',
    none: '未知'
};


export const CalendarView = ({ notes }: Props) => {
    const { theme } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiResult, setAiResult] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [presetTags, setPresetTags] = useState<Tag[]>([]);
    const [isAiInputFullscreen, setIsAiInputFullscreen] = useState(false);



    // Load preset tags on mount
    React.useEffect(() => {
        setPresetTags(getAllPresetTags());
    }, []);

    const markedDates = useMemo(() => {
        const marks: any = {};
        const dayMoods: Record<string, string> = {};
        notes.forEach(note => {
            const dateStr = format(new Date(note.timestamp), 'yyyy-MM-dd');
            if (!dayMoods[dateStr]) {
                dayMoods[dateStr] = note.moodType;
            }
        });

        Object.keys(dayMoods).forEach(date => {
            marks[date] = {
                customStyles: {
                    container: { backgroundColor: 'transparent' },
                    text: { color: theme.colors.text }
                },
                mood: dayMoods[date]
            };
        });

        return marks;
    }, [notes, theme]);

    // Calculate monthly stats
    const monthlyStats = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);

        const monthNotes = notes.filter(note =>
            isWithinInterval(new Date(note.timestamp), { start: monthStart, end: monthEnd })
        );

        // Mood counts
        const moodCounts: Record<string, number> = {};
        monthNotes.forEach(note => {
            if (note.moodType && note.moodType !== 'none') {
                moodCounts[note.moodType] = (moodCounts[note.moodType] || 0) + 1;
            }
        });

        // Tag counts
        const tagCounts: Record<string, number> = {};
        monthNotes.forEach(note => {
            note.tags?.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // Find top tag
        let topTag = '';
        let topTagCount = 0;
        Object.entries(tagCounts).forEach(([tag, count]) => {
            if (count > topTagCount) {
                topTag = tag;
                topTagCount = count;
            }
        });

        return { moodCounts, topTag, topTagCount, totalNotes: monthNotes.length, monthNotes };
    }, [notes, currentMonth]);

    const handleAISummarize = async () => {
        if (!aiPrompt.trim() && monthlyStats.totalNotes === 0) return;

        setIsAiLoading(true);
        setAiResult('');

        try {
            const monthName = format(currentMonth, 'yyyy年M月');
            const notesData = monthlyStats.monthNotes.map(n => ({
                content: n.content,
                mood: MOOD_LABELS[n.moodType as MoodType] || '未知',
                tags: n.tags?.join(', ') || '无标签',
                date: format(new Date(n.timestamp), 'MM-dd HH:mm')
            }));

            const userPrompt = aiPrompt.trim() || `请总结分析我${monthName}的心情记录`;

            // Build notes context string
            const notesContext = notesData.map(n => `[${n.date}] ${n.mood} | ${n.tags} | ${n.content}`).join('\n');

            // Create custom prompt template that includes both user request and notes
            const customPromptTemplate = `用户分析请求: ${userPrompt}

以下是${monthName}的所有笔记记录（共${monthlyStats.totalNotes}条）:
\${text}

请根据用户的请求，分析上述笔记内容并给出总结。请用自然语言回复，不要使用JSON格式。`;

            // Use summarize for raw text output instead of analyze
            const result = await aiService.summarize(notesContext, customPromptTemplate);
            setAiResult(result || '暂无分析结果');


        } catch (error) {
            setAiResult('AI 分析失败，请稍后重试');
        } finally {
            setIsAiLoading(false);
        }
    };

    const setDefaultPrompt = (prompt: string) => {
        setAiPrompt(prompt);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Calendar
                theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: theme.colors.secondaryText,
                    selectedDayBackgroundColor: theme.colors.accent,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: theme.colors.accent,
                    dayTextColor: theme.colors.text,
                    textDisabledColor: '#d9e1e8',
                    monthTextColor: theme.colors.text,
                    indicatorColor: theme.colors.accent,
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '300',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 14
                }}
                markingType={'custom'}
                markedDates={markedDates}
                onMonthChange={(month: any) => setCurrentMonth(new Date(month.dateString))}
                dayComponent={({ date, state, marking }: any) => {
                    const mood = marking?.mood;
                    return (
                        <View style={styles.dayCell}>
                            <Text style={[styles.dayText, { color: state === 'disabled' ? '#d9e1e8' : theme.colors.text }]}>
                                {date.day}
                            </Text>
                            {mood && (
                                <View style={styles.moodIndicator}>
                                    <MoodIcon mood={mood as MoodType} size={45} />
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            {/* Monthly Summary Section - No title */}
            <View style={[styles.summarySection, { borderTopColor: theme.colors.divider }]}>
                {/* Mood Stats in sentence format */}
                {(monthlyStats.moodCounts.happy > 0 || monthlyStats.moodCounts.anxious > 0 || monthlyStats.moodCounts.sad > 0) && (
                    <Text style={[styles.summaryText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>
                        你这个月
                        {monthlyStats.moodCounts.happy > 0 && <Text style={{ color: '#FFB6C1' }}>开心了<Text style={{ fontWeight: 'bold' }}>{monthlyStats.moodCounts.happy}</Text>次</Text>}

                        {monthlyStats.moodCounts.happy > 0 && (monthlyStats.moodCounts.anxious > 0 || monthlyStats.moodCounts.sad > 0) && '，'}
                        {monthlyStats.moodCounts.anxious > 0 && <Text style={{ color: '#9B59B6' }}>焦虑了<Text style={{ fontWeight: 'bold' }}>{monthlyStats.moodCounts.anxious}</Text>次</Text>}
                        {monthlyStats.moodCounts.anxious > 0 && monthlyStats.moodCounts.sad > 0 && '，'}
                        {monthlyStats.moodCounts.sad > 0 && <Text style={{ color: '#5DADE2' }}>难过了<Text style={{ fontWeight: 'bold' }}>{monthlyStats.moodCounts.sad}</Text>次</Text>}
                    </Text>
                )}

                {/* Top Tag with colored styling */}
                {monthlyStats.topTag && (() => {
                    const tagData = presetTags.find(t => t.name === monthlyStats.topTag);
                    const tagStyle = getTagStyles(tagData?.color || theme.colors.accent);
                    return (
                        <Text style={[styles.summaryText, { color: theme.colors.text, marginTop: 8 }, theme.isHandDrawn && theme.typography.body]}>
                            你这个月特别关心
                            <Text style={[styles.topTagChip, { backgroundColor: tagStyle.backgroundColor, color: tagStyle.color }]}>
                                #{monthlyStats.topTag}
                            </Text>
                            ，发了<Text style={{ fontWeight: 'bold' }}>{monthlyStats.topTagCount}</Text>次小树洞
                        </Text>
                    );
                })()}


                {/* AI Summary Input */}
                <View style={[styles.aiInputSection, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.divider }]}>
                    <View style={styles.aiHeader}>
                        <Sparkles size={16} color={theme.colors.accent} />
                        <Text style={[styles.aiTitle, { color: theme.colors.accent }]}>AI 总结分析</Text>
                    </View>

                    <View style={styles.promptSuggestions}>
                        <TouchableOpacity
                            style={[
                                styles.promptChip,
                                {
                                    backgroundColor: aiPrompt.includes('理财') ? theme.colors.accent + '30' : theme.colors.divider + '50',
                                    borderColor: aiPrompt.includes('理财') ? theme.colors.accent : (theme.isHandDrawn ? theme.colors.divider : 'rgba(0,0,0,0.2)'),
                                    borderWidth: 1,
                                }
                            ]}
                            onPress={() => {
                                setAiPrompt('用一百字左右，分析我这个月所有笔记中与理财相关的内容，总结我的收支情况和理财习惯');
                            }}
                        >
                            <Text style={[styles.promptChipText, { color: aiPrompt.includes('理财') ? theme.colors.accent : theme.colors.text }]}>理财分析</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.aiInputRow}>
                        <TouchableOpacity
                            style={[styles.aiInputTrigger, { borderColor: theme.colors.divider }]}
                            onPress={() => setIsAiInputFullscreen(true)}
                        >
                            <Text style={[styles.aiInputPlaceholder, { color: aiPrompt ? theme.colors.text : theme.colors.secondaryText }]} numberOfLines={3}>
                                {aiPrompt || '点击输入自定义分析提示词...'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.aiSendBtnIcon, { backgroundColor: theme.colors.accent }]}
                            onPress={handleAISummarize}
                            disabled={isAiLoading || !aiPrompt.trim()}
                        >
                            {isAiLoading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Sparkles size={20} color="#FFF" />
                            )}
                        </TouchableOpacity>
                    </View>

                    {aiResult && (
                        <View style={[styles.aiResultBox, { backgroundColor: theme.colors.divider + '30', borderLeftColor: theme.colors.accent }]}>
                            <Text style={[styles.aiResultText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>
                                {aiResult}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Fullscreen AI Input Modal */}
            <Modal visible={isAiInputFullscreen} animationType="slide" transparent={false}>
                <SafeAreaView style={[styles.fullscreenModal, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.fullscreenHeader}>
                        <TouchableOpacity onPress={() => setIsAiInputFullscreen(false)}>
                            <ChevronDown size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.fullscreenTitle, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.title]}>AI 分析提示词</Text>
                        <TouchableOpacity onPress={() => { setIsAiInputFullscreen(false); handleAISummarize(); }}>
                            <Send size={24} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>
                    <TextInput
                        style={[styles.fullscreenInput, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}
                        placeholder="输入你想让AI分析的内容，例如：分析我这个月的消费习惯..."
                        placeholderTextColor={theme.colors.secondaryText}
                        value={aiPrompt}
                        onChangeText={setAiPrompt}
                        multiline
                        autoFocus
                    />
                </SafeAreaView>
            </Modal>
        </ScrollView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    dayCell: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        width: 40,
    },
    dayText: {
        fontSize: 14,
        marginBottom: 4,
    },
    moodIndicator: {
        marginTop: 4,
    },
    summarySection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    moodStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    moodStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    moodStatText: {
        fontSize: 14,
    },
    topTagText: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 22,
    },
    aiInputSection: {
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    aiTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    promptSuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    promptChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    promptChipText: {
        fontSize: 12,
    },
    aiInputPlaceholder: {
        fontSize: 14,
    },
    aiResultBox: {
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderLeftWidth: 3,
    },
    aiResultText: {
        fontSize: 14,
        lineHeight: 22,
    },
    summaryText: {
        fontSize: 15,
        lineHeight: 24,
    },
    topTagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    aiInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    aiInputTrigger: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        minHeight: 80,
        justifyContent: 'flex-start',
    },
    aiSendBtnIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullscreenModal: {
        flex: 1,
        paddingTop: 40,
    },
    fullscreenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    fullscreenTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    fullscreenInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        lineHeight: 24,
        textAlignVertical: 'top',
    },
});

