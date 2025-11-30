/**
 * Profile Screen - User settings and statistics
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';

export default function ProfileScreen() {
  const {
    isDarkMode,
    language,
    userStats,
    toggleDarkMode,
    setLanguage,
    fetchUserStats,
  } = useQuizStore();

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const stats = [
    { label: '완료한 시험', value: userStats?.total_quizzes || 0, icon: 'assignment' },
    { label: '푼 문제', value: userStats?.total_questions_answered || 0, icon: 'help-outline' },
    { label: '정답', value: userStats?.correct_answers || 0, icon: 'check-circle' },
    { label: '정답률', value: `${Math.round(userStats?.accuracy_percentage || 0)}%`, icon: 'trending-up' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>프로필</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <MaterialIcons name="person" size={40} color={Colors.textDark} />
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>NVIDIA 인증 준비생</Text>
          <Text style={[styles.userSubtitle, { color: theme.muted }]}>
            열심히 공부 중!
          </Text>
        </View>

        {/* Statistics */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <MaterialIcons name={stat.icon as any} size={24} color={Colors.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.muted }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>설정</Text>

        <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
          {/* Language Setting */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="language" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>언어</Text>
            </View>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'ko' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('ko')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'ko' && styles.languageButtonTextActive,
                  ]}
                >
                  한국어
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === 'en' && styles.languageButtonActive,
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    language === 'en' && styles.languageButtonTextActive,
                  ]}
                >
                  English
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingDivider, { backgroundColor: theme.muted }]} />

          {/* Dark Mode Setting */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name={isDarkMode ? 'dark-mode' : 'light-mode'}
                size={24}
                color={theme.text}
              />
              <Text style={[styles.settingLabel, { color: theme.text }]}>다크 모드</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: Colors.primary }}
              thumbColor={isDarkMode ? Colors.textDark : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Info Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>정보</Text>

        <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="info" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>앱 버전</Text>
            </View>
            <Text style={[styles.settingValue, { color: theme.muted }]}>1.0.0</Text>
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: theme.muted }]} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="description" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>라이선스</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
          </TouchableOpacity>

          <View style={[styles.settingDivider, { backgroundColor: theme.muted }]} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="help" size={24} color={theme.text} />
              <Text style={[styles.settingLabel, { color: theme.text }]}>도움말</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  settingsCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  settingDivider: {
    height: 1,
    marginHorizontal: 16,
    opacity: 0.2,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  languageButtonActive: {
    backgroundColor: Colors.primary,
  },
  languageButtonText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  languageButtonTextActive: {
    color: Colors.textDark,
    fontWeight: '600',
  },
});
