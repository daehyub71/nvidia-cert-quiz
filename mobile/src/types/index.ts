/**
 * Type definitions for NVIDIA Cert Quiz app
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'en' | 'ko';
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned';

export interface Question {
  id: string;
  question_text_en: string;
  question_text_ko: string;
  options_en: string[];
  options_ko: string[];
  correct_answer: number;
  category: string;
  difficulty: Difficulty;
  source_day?: number;
  source_image_en?: string;
  source_image_ko?: string;
  created_at: string;
  updated_at?: string;
}

export interface QuizConfig {
  question_count: number;
  language: Language;
  categories?: string[];
  difficulty?: Difficulty;
  exclude_bookmarked?: boolean;
  wrong_answers_only?: boolean;
}

export interface QuizAnswer {
  question_id: string;
  selected_answer: number;
  time_spent_seconds: number;
}

export interface QuizResult {
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  results: QuestionResult[];
  completed_at: string;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  selected_answer: number;
  is_correct: boolean;
  explanation?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  question_id: string;
  note?: string;
  created_at: string;
}

export interface WrongAnswer {
  id: string;
  user_id: string;
  question_id: string;
  selected_answer: number;
  reviewed: boolean;
  reviewed_at?: string;
  created_at: string;
  question?: Question;
}

export interface UserStats {
  total_quizzes: number;
  total_questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  category_stats: Record<string, CategoryStat>;
  difficulty_stats: Record<string, number>;
  recent_scores: number[];
}

export interface CategoryStat {
  total: number;
  correct: number;
  accuracy: number;
}

export interface Explanation {
  question_id: string;
  explanation_en: string;
  explanation_ko: string;
  created_at: string;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  ExamSetup: undefined;
  ExamSession: { quizId: string; questions: Question[] };
  ExamResult: { quizId: string; result: QuizResult };
  QuestionDetail: { questionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Topics: undefined;
  History: undefined;
  Profile: undefined;
};
