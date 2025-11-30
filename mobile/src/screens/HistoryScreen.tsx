/**
 * History Screen - Quiz history and wrong answers review
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';

type TabType = 'history' | 'wrong' | 'bookmarks';

export default function HistoryScreen() {
  const {
    isDarkMode,
    quizHistory,
    wrongAnswers,
    bookmarks,
    fetchQuizHistory,
    fetchWrongAnswers,
    fetchBookmarks,
  } = useQuizStore();

  const [activeTab, setActiveTab] = useState<TabType>('history');

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  useEffect(() => {
    fetchQuizHistory();
    fetchWrongAnswers();
    fetchBookmarks();
  }, []);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'history', label: '시험 기록', count: quizHistory.length },
    { key: 'wrong', label: '오답 노트', count: wrongAnswers.length },
    { key: 'bookmarks', label: '북마크', count: bookmarks.length },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {quizHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={48} color={theme.muted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>시험 기록이 없습니다</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
            시험을 완료하면 여기에 기록됩니다
          </Text>
        </View>
      ) : (
        quizHistory.map((quiz, index) => (
          <TouchableOpacity
            key={quiz.id || index}
            style={[styles.historyItem, { backgroundColor: theme.surface }]}
          >
            <View style={styles.historyLeft}>
              <Text style={[styles.historyDate, { color: theme.muted }]}>
                {formatDate(quiz.started_at)}
              </Text>
              <Text style={[styles.historyTitle, { color: theme.text }]}>
                {quiz.question_ids?.length || 0}문제 시험
              </Text>
            </View>
            <View style={styles.historyRight}>
              <Text
                style={[
                  styles.historyScore,
                  { color: (quiz.score / quiz.question_ids?.length) * 100 >= 70 ? Colors.success : Colors.error },
                ]}
              >
                {quiz.score}/{quiz.question_ids?.length || 0}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderWrongTab = () => (
    <View style={styles.tabContent}>
      {wrongAnswers.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color={Colors.success} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>틀린 문제가 없습니다</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
            완벽해요! 계속 이 기세로 가세요
          </Text>
        </View>
      ) : (
        wrongAnswers.map((wrong, index) => (
          <TouchableOpacity
            key={wrong.id}
            style={[styles.wrongItem, { backgroundColor: theme.surface }]}
          >
            <View
              style={[
                styles.wrongIndicator,
                { backgroundColor: wrong.reviewed ? Colors.success : Colors.error },
              ]}
            />
            <View style={styles.wrongContent}>
              <Text style={[styles.wrongTitle, { color: theme.text }]} numberOfLines={2}>
                {wrong.question?.question_text_ko || `문제 ${index + 1}`}
              </Text>
              <Text style={[styles.wrongDate, { color: theme.muted }]}>
                {formatDate(wrong.created_at)}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderBookmarksTab = () => (
    <View style={styles.tabContent}>
      {bookmarks.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="bookmark-border" size={48} color={theme.muted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>북마크가 없습니다</Text>
          <Text style={[styles.emptySubtitle, { color: theme.muted }]}>
            시험 중 북마크 버튼을 눌러 저장하세요
          </Text>
        </View>
      ) : (
        bookmarks.map((bookmark, index) => (
          <TouchableOpacity
            key={bookmark.id}
            style={[styles.bookmarkItem, { backgroundColor: theme.surface }]}
          >
            <MaterialIcons name="bookmark" size={24} color={Colors.bookmarkBlue} />
            <View style={styles.bookmarkContent}>
              <Text style={[styles.bookmarkTitle, { color: theme.text }]} numberOfLines={2}>
                북마크 #{index + 1}
              </Text>
              {bookmark.note && (
                <Text style={[styles.bookmarkNote, { color: theme.muted }]} numberOfLines={1}>
                  {bookmark.note}
                </Text>
              )}
            </View>
            <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>학습 기록</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? Colors.primary : theme.muted },
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.tabBadge,
                { backgroundColor: activeTab === tab.key ? Colors.primary : theme.muted },
              ]}
            >
              <Text style={styles.tabBadgeText}>{tab.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'wrong' && renderWrongTab()}
        {activeTab === 'bookmarks' && renderBookmarksTab()}
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(118, 185, 0, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  historyLeft: {},
  historyDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  wrongItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  wrongIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wrongContent: {
    flex: 1,
  },
  wrongTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  wrongDate: {
    fontSize: 12,
    marginTop: 4,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  bookmarkNote: {
    fontSize: 14,
    marginTop: 4,
  },
});
