/**
 * Exam Result Screen - Display quiz results and explanations
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';
import { RootStackParamList, QuestionResult } from '../types';
import api from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'ExamResult'>;

export default function ExamResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { result } = route.params;

  const { isDarkMode, language, resetQuiz } = useQuizStore();
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  const scorePercentage = result.percentage;
  const isPassing = scorePercentage >= 70;

  const handleGoHome = () => {
    resetQuiz();
    navigation.navigate('MainTabs');
  };

  const handleRetakeExam = () => {
    resetQuiz();
    navigation.navigate('ExamSetup');
  };

  const toggleQuestion = async (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);

      // Fetch explanation if not already loaded
      if (!explanations[questionId]) {
        setLoadingExplanations((prev) => new Set(prev).add(questionId));
        try {
          const explanation = await api.getExplanation(questionId, language);
          setExplanations((prev) => ({
            ...prev,
            [questionId]: language === 'ko' ? explanation.explanation_ko : explanation.explanation_en,
          }));
        } catch (error) {
          console.error('Failed to fetch explanation:', error);
        } finally {
          setLoadingExplanations((prev) => {
            const newSet = new Set(prev);
            newSet.delete(questionId);
            return newSet;
          });
        }
      }
    }
    setExpandedQuestions(newExpanded);
  };

  const getScoreColor = () => {
    if (scorePercentage >= 80) return Colors.success;
    if (scorePercentage >= 60) return Colors.warning;
    return Colors.error;
  };

  const getGradeEmoji = () => {
    if (scorePercentage >= 90) return '🎉';
    if (scorePercentage >= 80) return '👏';
    if (scorePercentage >= 70) return '👍';
    if (scorePercentage >= 60) return '💪';
    return '📚';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>시험 결과</Text>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: theme.surface }]}>
          <Text style={styles.scoreEmoji}>{getGradeEmoji()}</Text>
          <Text style={[styles.scorePercentage, { color: getScoreColor() }]}>
            {Math.round(scorePercentage)}%
          </Text>
          <Text style={[styles.scoreDetails, { color: theme.text }]}>
            {result.score} / {result.total_questions} 정답
          </Text>
          <Text style={[styles.scoreMessage, { color: theme.muted }]}>
            {isPassing
              ? '합격 기준을 통과했습니다!'
              : '조금 더 노력이 필요합니다. 화이팅!'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={handleRetakeExam}
          >
            <MaterialIcons name="refresh" size={20} color={Colors.textLight} />
            <Text style={styles.actionButtonText}>다시 도전</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton, { backgroundColor: theme.surface }]}
            onPress={handleGoHome}
          >
            <MaterialIcons name="home" size={20} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>홈으로</Text>
          </TouchableOpacity>
        </View>

        {/* Results Header */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>문제별 결과</Text>

        {/* Question Results */}
        <View style={styles.resultsList}>
          {result.results.map((item, index) => {
            const isExpanded = expandedQuestions.has(item.question_id);
            const isLoading = loadingExplanations.has(item.question_id);

            return (
              <View key={item.question_id} style={[styles.resultItem, { backgroundColor: theme.surface }]}>
                <TouchableOpacity
                  style={styles.resultHeader}
                  onPress={() => toggleQuestion(item.question_id)}
                >
                  <View style={styles.resultLeft}>
                    <View
                      style={[
                        styles.resultIndicator,
                        { backgroundColor: item.is_correct ? Colors.success : Colors.error },
                      ]}
                    >
                      <MaterialIcons
                        name={item.is_correct ? 'check' : 'close'}
                        size={16}
                        color={Colors.textDark}
                      />
                    </View>
                    <Text style={[styles.resultNumber, { color: theme.muted }]}>
                      문제 {index + 1}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={theme.muted}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    <Text style={[styles.questionText, { color: theme.text }]}>
                      {item.question_text}
                    </Text>

                    <View style={styles.answerSection}>
                      <Text style={[styles.answerLabel, { color: theme.muted }]}>정답:</Text>
                      <Text style={[styles.answerText, { color: Colors.success }]}>
                        {item.options[item.correct_answer]}
                      </Text>
                    </View>

                    {!item.is_correct && (
                      <View style={styles.answerSection}>
                        <Text style={[styles.answerLabel, { color: theme.muted }]}>내 답변:</Text>
                        <Text style={[styles.answerText, { color: Colors.error }]}>
                          {item.options[item.selected_answer]}
                        </Text>
                      </View>
                    )}

                    <View style={styles.explanationSection}>
                      <Text style={[styles.explanationTitle, { color: theme.text }]}>해설</Text>
                      {isLoading ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: 8 }} />
                      ) : explanations[item.question_id] ? (
                        <Text style={[styles.explanationText, { color: theme.muted }]}>
                          {explanations[item.question_id]}
                        </Text>
                      ) : (
                        <Text style={[styles.explanationText, { color: theme.muted }]}>
                          해설을 불러오는 중...
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreCard: {
    margin: 16,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  scoreEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreDetails: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  scoreMessage: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  resultItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  resultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  answerSection: {
    marginBottom: 12,
  },
  answerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
