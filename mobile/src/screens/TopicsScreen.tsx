/**
 * Topics Screen - Browse questions by category
 */
import React, { useEffect } from 'react';
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

export default function TopicsScreen() {
  const { isDarkMode, categories, fetchCategories } = useQuizStore();

  const theme = isDarkMode
    ? { bg: Colors.backgroundDark, text: Colors.textDark, muted: Colors.textMutedDark, surface: 'rgba(15, 23, 42, 0.5)' }
    : { bg: Colors.backgroundLight, text: Colors.textLight, muted: Colors.textMutedLight, surface: '#FFFFFF' };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Group categories by first letter or type
  const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('deep') || lowerCategory.includes('neural')) return 'psychology';
    if (lowerCategory.includes('machine')) return 'memory';
    if (lowerCategory.includes('nlp') || lowerCategory.includes('language')) return 'translate';
    if (lowerCategory.includes('vision') || lowerCategory.includes('image')) return 'visibility';
    if (lowerCategory.includes('data')) return 'storage';
    if (lowerCategory.includes('train')) return 'model-training';
    if (lowerCategory.includes('eval') || lowerCategory.includes('metric')) return 'analytics';
    if (lowerCategory.includes('ethic') || lowerCategory.includes('bias')) return 'balance';
    if (lowerCategory.includes('deploy')) return 'cloud-upload';
    if (lowerCategory.includes('prompt')) return 'chat';
    return 'category';
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      Colors.primary,
      Colors.bookmarkBlue,
      Colors.studyPurple,
      Colors.statisticsGreen,
      Colors.warning,
      Colors.incorrectRed,
    ];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>주제별 학습</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            {categories.length}개 카테고리
          </Text>
        </View>

        {/* Categories Grid */}
        <View style={styles.categoryGrid}>
          {categories.map((category, index) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryCard, { backgroundColor: theme.surface }]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: `${getCategoryColor(index)}20` },
                ]}
              >
                <MaterialIcons
                  name={getCategoryIcon(category)}
                  size={24}
                  color={getCategoryColor(index)}
                />
              </View>
              <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={2}>
                {category}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color={theme.muted} />
            </TouchableOpacity>
          ))}
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
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  categoryGrid: {
    padding: 16,
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
