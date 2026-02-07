import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../core/theme';
import { X, Palette, Tag, Cpu, ChevronDown, Filter, Settings } from 'lucide-react-native';
import { Tag as TagModel } from '../../core/models';
import { useRouter } from 'expo-router';

interface Props {
    onClose: () => void;
    currentFilter: string | null;
    onFilterChange: (tag: string | null) => void;
}

export const DrawerMenu = ({ onClose, currentFilter, onFilterChange }: Props) => {
    const { theme, themeType, toggleTheme } = useTheme();
    const router = useRouter();
    const [tags, setTags] = React.useState<TagModel[]>([]);
    const [isFilterExpanded, setIsFilterExpanded] = React.useState(false);

    React.useEffect(() => {
        // Load custom tags for filter
        import('../../core/storage').then(storage => {
            setTags(storage.getAllPresetTags());
        });
    }, []);

    const isHandDrawn = themeType === 'handdrawn';
    const sectionBg = isHandDrawn ? '#FBF9F6' : '#F9F9F9';
    const itemSelectedBg = isHandDrawn ? '#F0EDE8' : '#F0F0F0';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.cardBackground }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.title, theme.isHandDrawn && { fontWeight: '400' }]}>个性化</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* 筛选 Section */}
                <View style={[
                    styles.sectionWrapper,
                    isHandDrawn && styles.handDrawnSection,
                    { borderColor: theme.colors.divider, backgroundColor: sectionBg }
                ]}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                    >
                        <View style={styles.sectionTitleContent}>
                            <View style={[styles.filterIcon, { backgroundColor: isHandDrawn ? '#F0EDE8' : '#F0F0F0' }]}>
                                <Filter size={14} color={theme.colors.text} />
                            </View>
                            <Text style={[styles.sectionTitleText, { color: theme.colors.text }]}>
                                {currentFilter || '全部'}
                            </Text>
                        </View>
                        <ChevronDown
                            size={16}
                            color={theme.colors.secondaryText}
                            style={{ transform: [{ rotate: isFilterExpanded ? '180deg' : '0deg' }] }}
                        />
                    </TouchableOpacity>

                    {isFilterExpanded && (
                        <View style={styles.filterList}>
                            <TouchableOpacity
                                style={[styles.filterItem, !currentFilter && { backgroundColor: itemSelectedBg }]}
                                onPress={() => { onFilterChange(null); onClose(); }}
                            >
                                <Text style={[styles.filterItemText, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.body]}>全部记录</Text>
                            </TouchableOpacity>
                            {tags.map(tag => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={[styles.filterItem, currentFilter === tag.name && { backgroundColor: itemSelectedBg }]}
                                    onPress={() => { onFilterChange(tag.name); onClose(); }}
                                >
                                    <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                                    <Text style={[styles.filterItemText, { color: theme.colors.text, flex: 1 }, theme.isHandDrawn && theme.typography.body]}>{tag.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* 功能 Section */}
                <View style={[
                    styles.sectionWrapper,
                    isHandDrawn && styles.handDrawnSection,
                    { borderColor: theme.colors.divider, backgroundColor: sectionBg }
                ]}>
                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => { onClose(); router.push('/tags'); }}
                    >
                        <Tag size={20} color={theme.colors.text} />
                        <Text style={[styles.sectionTitleText, { color: theme.colors.text }]}>标签管理</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => { onClose(); router.push('/general-settings'); }}
                    >
                        <Settings size={20} color={theme.colors.text} />
                        <Text style={[styles.sectionTitleText, { color: theme.colors.text }]}>通用设置</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => { onClose(); router.push('/ai-settings'); }}
                    >
                        <Cpu size={20} color={theme.colors.text} />
                        <Text style={[styles.sectionTitleText, { color: theme.colors.text }]}>AI 设置</Text>
                    </TouchableOpacity>
                </View>

                {/* 主题 Section */}
                <View style={[
                    styles.sectionWrapper,
                    isHandDrawn && styles.handDrawnSection,
                    { borderColor: theme.colors.divider, backgroundColor: sectionBg }
                ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                        <View style={[styles.filterIcon, { backgroundColor: isHandDrawn ? '#F0EDE8' : '#F0F0F0' }]}>
                            <Palette size={14} color={theme.colors.text} />
                        </View>
                        <Text style={[styles.sectionTitleText, { color: theme.colors.text }]}>主题风格</Text>
                    </View>
                    <View style={styles.themeToggleRow}>
                        <TouchableOpacity
                            style={[styles.themeOption, themeType === 'handdrawn' && styles.themeOptionActive]}
                            onPress={() => themeType !== 'handdrawn' && toggleTheme()}
                        >
                            <View style={[styles.themeCircle, styles.handDrawnCircle]} />
                            <Text style={[styles.themeText, { color: theme.colors.text }]}>手账风</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.themeOption, themeType === 'minimalist' && styles.themeOptionActive]}
                            onPress={() => themeType !== 'minimalist' && toggleTheme()}
                        >
                            <View style={[styles.themeCircle, styles.minimalistCircle]} />
                            <Text style={[styles.themeText, { color: theme.colors.text }]}>简约风</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Text style={{ color: theme.colors.secondaryText, fontSize: 12 }}>心情树洞 v1.0.0</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    closeBtn: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    scroll: {
        flex: 1,
    },
    sectionWrapper: {
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 15,
        backgroundColor: '#FBF9F6',
        borderRadius: 20,
    },
    handDrawnSection: {
        borderWidth: 1.5,
        borderStyle: 'dashed',
        backgroundColor: 'transparent',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    filterIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitleText: {
        fontSize: 16,
        fontWeight: 'normal',
    },
    filterList: {
        marginTop: 15,
        gap: 8,
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 10,
    },
    filterItemSelected: {
        backgroundColor: '#F0EDE8',
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    filterItemText: {
        fontSize: 14,
    },
    menuIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        paddingVertical: 12,
    },
    menuIconText: {
        fontSize: 16,
        fontWeight: 'normal',
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'normal',
        marginBottom: 15,
        opacity: 0.6,
    },
    themeToggleRow: {
        flexDirection: 'row',
        gap: 20,
    },
    themeOption: {
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeOptionActive: {
        borderColor: '#D4BFA4',
        backgroundColor: '#FFF',
    },
    themeCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    handDrawnCircle: {
        borderStyle: 'dashed',
        backgroundColor: '#FDFCFB',
    },
    minimalistCircle: {
        backgroundColor: '#FFF',
    },
    themeText: {
        fontSize: 13,
        fontWeight: '500',
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
});
