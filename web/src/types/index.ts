export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'en' | 'ko';

export interface Question {
  id: string;
  question_text_en: string;
  question_text_ko: string;
  options_en: string[];
  options_ko: string[];
  correct_answer: number;
  category: string;
  difficulty: Difficulty;
  source_day?: number | null;
  source_image_en?: string | null;
  source_image_ko?: string | null;
  created_at: string;
  updated_at?: string;
  // API may return simplified version with pre-selected language
  question_text?: string;
  options?: string[];
}

export interface QuizConfig {
  question_count: number;
  language: Language;
  categories?: string[];
  difficulty?: Difficulty;
}

export interface QuizAnswer {
  question_id: string;
  selected_answer: number;
  time_spent_seconds: number;
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  options: string[];
  question_text_en: string;
  question_text_ko: string;
  options_en: string[];
  options_ko: string[];
  correct_answer: number;
  selected_answer: number;
  is_correct: boolean;
  explanation?: string;
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
  category_stats: Record<string, { total: number; correct: number; accuracy: number }>;
  difficulty_stats: Record<string, number>;
  recent_scores: number[];
}

export interface Explanation {
  question_id: string;
  explanation_en: string;
  explanation_ko: string;
  created_at: string;
}
