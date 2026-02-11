import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeType } from '../../core/theme';
import { X, Palette, Tag, Cpu, ChevronDown, Filter, Settings, Check } from 'lucide-react-native';
import { Tag as TagModel } from '../../core/models';
import { useRouter } from 'expo-router';

interface Props {
    onClose: () => void;
    currentFilter: string | null;
    onFilterChange: (tag: string | null) => void;
}

export const DrawerMenu = ({ onClose, currentFilter, onFilterChange }: Props) => {
    const { theme, themeType, setTheme, toggleTheme } = useTheme();
    const insets = useSafeAreaInsets();
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
        <View style={[styles.container, { backgroundColor: theme.colors.cardBackground, paddingTop: Math.max(insets.top, 20) }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={require('../../../assets/favicon.png')}
                        style={styles.logoIcon}
                    />
                    <Text style={[styles.title, { color: theme.colors.text }, theme.isHandDrawn && theme.typography.title, { fontFamily: 'DancingScript_700Bold', fontSize: 32, fontWeight: '400' }]}>Champignon</Text>
                </View>
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
                        onPress={() => {
                            onClose();
                            router.push('/ai-settings');
                        }}
                    >
                        <Cpu size={20} color={theme.colors.accent} strokeWidth={2} />
                        <Text style={[styles.menuIconText, { color: theme.colors.text }]}>AI 设置</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => {
                            onClose();
                            router.push('/prompt-management');
                        }}
                    >
                        <Settings size={20} color={theme.colors.accent} strokeWidth={2} />
                        <Text style={[styles.menuIconText, { color: theme.colors.text }]}>提示词管理</Text>
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
                    <View style={styles.themeSelectorRow}>
                        {(['handdrawn', 'minimalist'] as ThemeType[]).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.themeOption,
                                    theme.themeType === t && { borderColor: theme.colors.accent, backgroundColor: theme.colors.divider + '20' }
                                ]}
                                onPress={() => setTheme(t)}
                            >
                                <View style={[
                                    styles.themeSwatch,
                                    { backgroundColor: t === 'handdrawn' ? '#F7F5F0' : '#FFFFFF' },
                                    { borderColor: t === 'handdrawn' ? '#8D6E63' : '#222222', borderStyle: t === 'handdrawn' ? 'dashed' : 'solid' }
                                ]}>
                                    {t === 'handdrawn' ? (
                                        <Palette size={16} color="#8D6E63" />
                                    ) : (
                                        <View style={{ width: 14, height: 14, backgroundColor: '#222222', borderRadius: 2 }} />
                                    )}
                                    {theme.themeType === t && (
                                        <View style={[styles.checkBadge, { backgroundColor: theme.colors.accent }]}>
                                            <Check size={10} color="#FFF" strokeWidth={3} />
                                        </View>
                                    )}
                                </View>
                                <Text style={[
                                    styles.themeText,
                                    { color: theme.themeType === t ? theme.colors.accent : theme.colors.text },
                                    theme.isHandDrawn && theme.typography.caption,
                                    { fontSize: 13, marginTop: 6, fontWeight: theme.themeType === t ? 'bold' : 'normal' }
                                ]}>
                                    {t === 'handdrawn' ? '手账' : '简约'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <Text style={{ color: theme.colors.secondaryText, fontSize: 12 }}>Champignon v1.0.0</Text>
            </View>
        </View>
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
    logoIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
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
    themeSelectorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
        marginTop: 10,
        gap: 8,
    },
    themeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themeSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    themeInnerAccent: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    checkBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    themeText: {
        fontSize: 13,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
    },
});
