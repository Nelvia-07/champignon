import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { useTheme } from '../src/core/theme';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getGeneralSettings, updateGeneralSetting } from '../src/core/storage';

export default function GeneralSettingsScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const [settings, setSettings] = useState({
        inputAreaDefaultState: 'collapsed' as 'collapsed' | 'expanded'
    });

    useEffect(() => {
        const currentSettings = getGeneralSettings();
        setSettings(currentSettings);
    }, []);

    const handleSave = () => {
        updateGeneralSetting('inputAreaDefaultState', settings.inputAreaDefaultState);
        router.back();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>通用设置</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Save size={24} color={theme.colors.accent} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={[styles.section, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={styles.settingRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>首页输入框默认展开</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.secondaryText, marginTop: 4 }}>
                                开启后首页默认显示输入框，关闭则显示悬浮按钮
                            </Text>
                        </View>
                        <Switch
                            value={settings.inputAreaDefaultState === 'expanded'}
                            onValueChange={(val) => setSettings({
                                ...settings,
                                inputAreaDefaultState: val ? 'expanded' : 'collapsed'
                            })}
                            trackColor={{ false: '#ddd', true: theme.colors.accent }}
                        />
                    </View>
                </View>
            </View>
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
        borderRadius: 15,
        padding: 16,
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '500',
    }
});
