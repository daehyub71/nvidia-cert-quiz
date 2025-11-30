/**
 * Exam Setup Screen - Configure quiz settings before starting
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useQuizStore } from '../stores/quizStore';
import { RootStackParamList, Difficulty, Language } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QUESTION_COUNTS = [5, 10, 15, 20];
const DIFFICULTIES: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
];

export default function ExamSetupScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { isDarkMode, categories, fetchCategories, startQuiz, isLoading, language } = useQuizStore();

  const [questionCount, setQuestionCount] = useState(10);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleStartExam = async () => {
    try {
      await startQuiz({
        question_count: questionCount,
        language: language,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined,
      });

      const { currentQuizId, currentQuestions } = useQuizStore.getState();
      if (currentQuizId && currentQuestions.length > 0) {
        navigation.replace('ExamSession', {
          quizId: currentQuizId,
          questions: currentQuestions,
        });
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>시험 설정</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Question Count Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>문제 수</Text>
          <Text style={[styles.sectionDescription, { color: theme.muted }]}>
            시험에 포함할 문제 수를 선택하세요
          </Text>
          <View style={styles.optionGrid}>
            {QUESTION_COUNTS.map((count) => (
              <TouchableOpacity
                key={count}
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.surface },
                  questionCount === count && styles.optionButtonSelected,
                ]}
                onPress={() => setQuestionCount(count)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: theme.text },
                    questionCount === count && styles.optionButtonTextSelected,
                  ]}
                >
                  {count}문제
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>난이도</Text>
          <Text style={[styles.sectionDescription, { color: theme.muted }]}>
            원하는 난이도를 선택하세요
          </Text>
          <View style={styles.optionGrid}>
            {DIFFICULTIES.map((diff) => (
              <TouchableOpacity
                key={diff.value}
                style={[
                  styles.optionButton,
                  { backgroundColor: theme.surface },
                  selectedDifficulty === diff.value && styles.optionButtonSelected,
                ]}
                onPress={() => setSelectedDifficulty(diff.value)}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    { color: theme.text },
                    selectedDifficulty === diff.value && styles.optionButtonTextSelected,
                  ]}
                >
                  {diff.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowCategories(!showCategories)}
          >
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>카테고리 선택</Text>
              <Text style={[styles.sectionDescription, { color: theme.muted }]}>
                {selectedCategories.length === 0
                  ? '전체 카테고리'
                  : `${selectedCategories.length}개 선택됨`}
              </Text>
            </View>
            <MaterialIcons
              name={showCategories ? 'expand-less' : 'expand-more'}
              size={24}
              color={theme.muted}
            />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.categoryList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    { backgroundColor: theme.surface },
                    selectedCategories.includes(category) && styles.categoryItemSelected,
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: theme.text },
                      selectedCategories.includes(category) && styles.categoryTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                  {selectedCategories.includes(category) && (
                    <MaterialIcons name="check" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.summaryTitle, { color: theme.text }]}>시험 요약</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>문제 수</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{questionCount}문제</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>난이도</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {DIFFICULTIES.find((d) => d.value === selectedDifficulty)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.muted }]}>카테고리</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {selectedCategories.length === 0 ? '전체' : `${selectedCategories.length}개`}
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Start Button */}
      <View style={[styles.footer, { backgroundColor: theme.bg }]}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: Colors.primary }]}
          onPress={handleStartExam}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textLight} />
          ) : (
            <>
              <MaterialIcons name="play-arrow" size={24} color={Colors.textLight} />
              <Text style={styles.startButtonText}>시험 시작</Text>
            </>
          )}
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
    paddingTop: 8,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(118, 185, 0, 0.1)',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionButtonTextSelected: {
    color: Colors.primary,
  },
  categoryList: {
    marginTop: 12,
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(118, 185, 0, 0.1)',
  },
  categoryText: {
    fontSize: 16,
  },
  categoryTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
  },
  startButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
