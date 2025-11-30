/**
 * Question Detail Screen - View question details and explanation
 */
import React, { useEffect, useState } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';
import { RootStackParamList, Question, Explanation } from '../types';
import api from '../services/api';

type RouteType = RouteProp<RootStackParamList, 'QuestionDetail'>;

export default function QuestionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { questionId } = route.params;

  const { isDarkMode, language, isBookmarked, addBookmark, removeBookmark } = useQuizStore();

  const [question, setQuestion] = useState<Question | null>(null);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  const questionIsBookmarked = question ? isBookmarked(question.id) : false;

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    setIsLoading(true);
    try {
      const q = await api.getQuestion(questionId);
      setQuestion(q);

      const exp = await api.getExplanation(questionId, language);
      setExplanation(exp);
    } catch (error) {
      console.error('Failed to load question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!question) return;
    if (questionIsBookmarked) {
      await removeBookmark(question.id);
    } else {
      await addBookmark(question.id);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={Colors.error} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            문제를 찾을 수 없습니다
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const questionText = language === 'ko' ? question.question_text_ko : question.question_text_en;
  const options = language === 'ko' ? question.options_ko : question.options_en;
  const explanationText = language === 'ko' ? explanation?.explanation_ko : explanation?.explanation_en;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>문제 상세</Text>
        <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkButton}>
          <MaterialIcons
            name={questionIsBookmarked ? 'bookmark' : 'bookmark-border'}
            size={28}
            color={questionIsBookmarked ? Colors.bookmarkBlue : theme.muted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(118, 185, 0, 0.1)' }]}>
          <Text style={[styles.categoryText, { color: Colors.primary }]}>
            {question.category}
          </Text>
        </View>

        {/* Question */}
        <Text style={[styles.questionText, { color: theme.text }]}>{questionText}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options?.map((option, index) => {
            const isCorrect = index === question.correct_answer;
            return (
              <View
                key={index}
                style={[
                  styles.optionItem,
                  { backgroundColor: theme.surface },
                  showAnswer && isCorrect && styles.optionCorrect,
                ]}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    showAnswer && isCorrect && styles.optionIndicatorCorrect,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionNumber,
                      showAnswer && isCorrect && styles.optionNumberCorrect,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.optionText, { color: theme.text }]}>{option}</Text>
              </View>
            );
          })}
        </View>

        {/* Show Answer Button */}
        {!showAnswer && (
          <TouchableOpacity
            style={[styles.showAnswerButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowAnswer(true)}
          >
            <MaterialIcons name="visibility" size={20} color={Colors.textLight} />
            <Text style={styles.showAnswerText}>정답 보기</Text>
          </TouchableOpacity>
        )}

        {/* Explanation */}
        {showAnswer && (
          <View style={[styles.explanationCard, { backgroundColor: theme.surface }]}>
            <View style={styles.explanationHeader}>
              <MaterialIcons name="lightbulb" size={24} color={Colors.warning} />
              <Text style={[styles.explanationTitle, { color: theme.text }]}>해설</Text>
            </View>
            {explanationText ? (
              <Text style={[styles.explanationText, { color: theme.muted }]}>
                {explanationText}
              </Text>
            ) : (
              <Text style={[styles.explanationText, { color: theme.muted }]}>
                해설을 불러오는 중...
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  optionCorrect: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIndicatorCorrect: {
    backgroundColor: Colors.success,
  },
  optionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  optionNumberCorrect: {
    color: Colors.textDark,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  showAnswerText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  explanationCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  explanationText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
