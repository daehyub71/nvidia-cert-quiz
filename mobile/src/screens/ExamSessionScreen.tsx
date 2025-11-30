/**
 * Exam Session Screen - Question solving interface
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';
import { RootStackParamList, Question } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'ExamSession'>;

export default function ExamSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { quizId, questions } = route.params;

  const {
    isDarkMode,
    language,
    currentQuestionIndex,
    answers,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    isBookmarked,
    addBookmark,
    removeBookmark,
  } = useQuizStore();

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isQuestionBookmarked = currentQuestion ? isBookmarked(currentQuestion.id) : false;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load existing answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.find((a) => a.question_id === currentQuestion.id);
      setSelectedAnswer(existingAnswer ? existingAnswer.selected_answer : null);
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
    answerQuestion(index);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    previousQuestion();
  };

  const handleSubmit = () => {
    Alert.alert(
      '시험 제출',
      '시험을 제출하시겠습니까? 제출 후에는 답변을 변경할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제출',
          style: 'default',
          onPress: async () => {
            const result = await submitQuiz();
            if (result) {
              navigation.replace('ExamResult', { quizId, result });
            }
          },
        },
      ]
    );
  };

  const handleQuit = () => {
    Alert.alert(
      '시험 종료',
      '시험을 종료하시겠습니까? 진행 상황이 저장되지 않습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          style: 'destructive',
          onPress: () => {
            navigation.navigate('MainTabs');
          },
        },
      ]
    );
  };

  const handleToggleBookmark = async () => {
    if (isQuestionBookmarked) {
      await removeBookmark(currentQuestion.id);
    } else {
      await addBookmark(currentQuestion.id);
    }
  };

  const questionText = language === 'ko' ? currentQuestion?.question_text_ko : currentQuestion?.question_text_en;
  const options = language === 'ko' ? currentQuestion?.options_ko : currentQuestion?.options_en;

  if (!currentQuestion) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
          <MaterialIcons name="close" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.progressInfo}>
          <Text style={[styles.questionNumber, { color: theme.text }]}>
            {currentQuestionIndex + 1} / {questions.length}
          </Text>
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={16} color={Colors.primary} />
            <Text style={[styles.timerText, { color: Colors.primary }]}>
              {formatTime(elapsedTime)}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleToggleBookmark} style={styles.bookmarkButton}>
          <MaterialIcons
            name={isQuestionBookmarked ? 'bookmark' : 'bookmark-border'}
            size={24}
            color={isQuestionBookmarked ? Colors.bookmarkBlue : theme.muted}
          />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? 'rgba(100, 116, 139, 0.3)' : '#E2E8F0' }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                backgroundColor: Colors.primary,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: 'rgba(118, 185, 0, 0.1)' }]}>
          <Text style={[styles.categoryText, { color: Colors.primary }]}>
            {currentQuestion.category}
          </Text>
        </View>

        {/* Question Text */}
        <Text style={[styles.questionText, { color: theme.text }]}>{questionText}</Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options?.map((option, index) => {
            const isSelected = selectedAnswer === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.surface },
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelectAnswer(index)}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    { borderColor: isSelected ? Colors.primary : theme.muted },
                    isSelected && styles.optionIndicatorSelected,
                  ]}
                >
                  {isSelected && <View style={styles.optionIndicatorFill} />}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    { color: theme.text },
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer Navigation */}
      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            { backgroundColor: theme.surface },
            isFirstQuestion && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={isFirstQuestion}
        >
          <MaterialIcons
            name="chevron-left"
            size={24}
            color={isFirstQuestion ? theme.muted : theme.text}
          />
          <Text
            style={[
              styles.navButtonText,
              { color: isFirstQuestion ? theme.muted : theme.text },
            ]}
          >
            이전
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: Colors.primary },
          ]}
          onPress={handleNext}
        >
          <Text style={[styles.navButtonText, { color: Colors.textLight }]}>
            {isLastQuestion ? '제출' : '다음'}
          </Text>
          <MaterialIcons
            name={isLastQuestion ? 'check' : 'chevron-right'}
            size={24}
            color={Colors.textLight}
          />
        </TouchableOpacity>
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
  quitButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scrollContent: {
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(118, 185, 0, 0.1)',
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  optionIndicatorSelected: {
    borderColor: Colors.primary,
  },
  optionIndicatorFill: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  navButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  prevButton: {},
  nextButton: {},
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
