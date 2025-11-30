/**
 * Home Screen - Dashboard with progress and quick actions
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    isDarkMode,
    userStats,
    bookmarks,
    wrongAnswers,
    fetchUserStats,
    fetchBookmarks,
    fetchWrongAnswers,
    isLoading,
  } = useQuizStore();

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: Colors.surfaceDark }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: Colors.surfaceLight };

  useEffect(() => {
    fetchUserStats();
    fetchBookmarks();
    fetchWrongAnswers();
  }, []);

  const progressPercentage = userStats?.accuracy_percentage || 0;

  const handleStartExam = () => {
    navigation.navigate('ExamSetup');
  };

  const handleQuickReview = () => {
    // Navigate to wrong answers review
    navigation.navigate('MainTabs', { screen: 'History' } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top App Bar */}
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={[styles.profileImage, { backgroundColor: Colors.primary }]}>
              <MaterialIcons name="person" size={24} color={Colors.textDark} />
            </View>
          </View>
          <Text style={[styles.welcomeText, { color: theme.text }]}>
            환영합니다!
          </Text>
          <TouchableOpacity style={styles.settingsButton}>
            <MaterialIcons name="settings" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Headline */}
        <Text style={[styles.headline, { color: theme.text }]}>학습 진도</Text>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: theme.muted }]}>
              전체 시험 준비도
            </Text>
            <Text style={[styles.progressValue, { color: theme.text }]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#E2E8F0' }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%`, backgroundColor: Colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressHint, { color: theme.muted }]}>
            {progressPercentage >= 80
              ? '훌륭합니다! 시험 준비가 잘 되어 있습니다!'
              : progressPercentage >= 50
              ? '좋은 진행 상황입니다. 계속 노력하세요!'
              : '시작이 반입니다. 꾸준히 학습하세요!'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: Colors.primary }]}
            onPress={handleStartExam}
          >
            <Text style={styles.primaryButtonText}>새 시험 시작</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: isDarkMode ? 'rgba(118, 185, 0, 0.3)' : 'rgba(118, 185, 0, 0.2)' },
            ]}
            onPress={handleQuickReview}
          >
            <Text style={[styles.secondaryButtonText, { color: isDarkMode ? theme.text : Colors.textLight }]}>
              빠른 복습
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Header */}
        <Text style={[styles.sectionHeader, { color: theme.text }]}>복습 & 학습</Text>

        {/* Feature Cards */}
        <View style={styles.cardGrid}>
          {/* Incorrect Answers Card */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF' }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <MaterialIcons name="cancel" size={24} color={Colors.incorrectRed} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>오답 노트</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
              {wrongAnswers.length}개 문제
            </Text>
          </TouchableOpacity>

          {/* Bookmarked Card */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF' }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <MaterialIcons name="bookmark" size={24} color={Colors.bookmarkBlue} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>북마크</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
              {bookmarks.length}개 문제
            </Text>
          </TouchableOpacity>

          {/* Statistics Card */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF' }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <MaterialIcons name="bar-chart" size={24} color={Colors.statisticsGreen} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>통계</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>성과 보기</Text>
          </TouchableOpacity>

          {/* Study Mode Card */}
          <TouchableOpacity
            style={[styles.featureCard, { backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF' }]}
          >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <MaterialIcons name="school" size={24} color={Colors.studyPurple} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>학습 모드</Text>
            <Text style={[styles.cardSubtitle, { color: theme.muted }]}>자유롭게 학습</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
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
    padding: 16,
  },
  profileContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  settingsButton: {
    width: 48,
    alignItems: 'flex-end',
  },
  headline: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 14,
    marginTop: 12,
  },
  buttonGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 12,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 16,
  },
  featureCard: {
    width: '47%',
    height: 128,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
