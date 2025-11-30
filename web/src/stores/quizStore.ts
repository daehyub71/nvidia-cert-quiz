import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuizConfig, QuizResult, QuizAnswer, Bookmark, WrongAnswer, UserStats, Language } from '../types';
import api from '../services/api';

interface QuizState {
  // Settings
  language: Language;
  isDarkMode: boolean;

  // Current quiz
  currentQuizId: string | null;
  currentQuestions: Question[];
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  quizStartTime: number | null;
  questionStartTime: number | null;

  // Data
  categories: string[];
  bookmarks: Bookmark[];
  wrongAnswers: WrongAnswer[];
  userStats: UserStats | null;

  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  startQuiz: (config: QuizConfig) => Promise<void>;
  answerQuestion: (answer: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitQuiz: () => Promise<QuizResult | null>;
  resetQuiz: () => void;
  fetchCategories: () => Promise<void>;
  fetchBookmarks: () => Promise<void>;
  fetchWrongAnswers: () => Promise<void>;
  fetchUserStats: () => Promise<void>;
  addBookmark: (questionId: string, note?: string) => Promise<void>;
  removeBookmark: (questionId: string) => Promise<void>;
  isBookmarked: (questionId: string) => boolean;
  initializeUser: () => void;
  retakeQuiz: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      language: 'en',
      isDarkMode: true,
      currentQuizId: null,
      currentQuestions: [],
      currentQuestionIndex: 0,
      answers: [],
      quizStartTime: null,
      questionStartTime: null,
      categories: [],
      bookmarks: [],
      wrongAnswers: [],
      userStats: null,
      isLoading: false,
      error: null,

      setLanguage: (lang) => set({ language: lang }),

      toggleDarkMode: () => {
        const newMode = !get().isDarkMode;
        document.body.className = newMode ? '' : 'light';
        set({ isDarkMode: newMode });
      },

      startQuiz: async (config) => {
        set({ isLoading: true, error: null });
        try {
          const { quiz_id, questions } = await api.startQuiz(config);
          set({
            currentQuizId: quiz_id,
            currentQuestions: questions,
            currentQuestionIndex: 0,
            answers: [],
            quizStartTime: Date.now(),
            questionStartTime: Date.now(),
            isLoading: false,
          });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      answerQuestion: (answer) => {
        const { currentQuestions, currentQuestionIndex, answers, questionStartTime } = get();
        const question = currentQuestions[currentQuestionIndex];
        const timeSpent = questionStartTime ? Math.floor((Date.now() - questionStartTime) / 1000) : 0;

        const newAnswer: QuizAnswer = {
          question_id: question.id,
          selected_answer: answer,
          time_spent_seconds: timeSpent,
        };

        const existingIndex = answers.findIndex(a => a.question_id === question.id);
        if (existingIndex >= 0) {
          const newAnswers = [...answers];
          newAnswers[existingIndex] = newAnswer;
          set({ answers: newAnswers });
        } else {
          set({ answers: [...answers, newAnswer] });
        }
      },

      nextQuestion: () => {
        const { currentQuestionIndex, currentQuestions } = get();
        if (currentQuestionIndex < currentQuestions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1, questionStartTime: Date.now() });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1, questionStartTime: Date.now() });
        }
      },

      submitQuiz: async () => {
        const { currentQuizId, answers, quizStartTime } = get();
        if (!currentQuizId) return null;

        set({ isLoading: true, error: null });
        try {
          const totalTime = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;
          const result = await api.submitQuiz(currentQuizId, answers, totalTime);
          set({ isLoading: false });
          return result;
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      resetQuiz: () => {
        set({
          currentQuizId: null,
          currentQuestions: [],
          currentQuestionIndex: 0,
          answers: [],
          quizStartTime: null,
          questionStartTime: null,
        });
      },

      retakeQuiz: () => {
        // Keep the same questions but reset answers and timing
        set({
          currentQuestionIndex: 0,
          answers: [],
          quizStartTime: Date.now(),
          questionStartTime: Date.now(),
        });
      },

      fetchCategories: async () => {
        try {
          const categories = await api.getCategories();
          set({ categories });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      fetchBookmarks: async () => {
        try {
          const bookmarks = await api.getBookmarks();
          set({ bookmarks });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      fetchWrongAnswers: async () => {
        try {
          const wrongAnswers = await api.getWrongAnswers();
          set({ wrongAnswers });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      fetchUserStats: async () => {
        try {
          const userStats = await api.getUserStats();
          set({ userStats });
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      addBookmark: async (questionId, note) => {
        try {
          const bookmark = await api.addBookmark(questionId, note);
          set(state => ({ bookmarks: [...state.bookmarks, bookmark] }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      removeBookmark: async (questionId) => {
        try {
          await api.removeBookmark(questionId);
          set(state => ({ bookmarks: state.bookmarks.filter(b => b.question_id !== questionId) }));
        } catch (error: any) {
          set({ error: error.message });
        }
      },

      isBookmarked: (questionId) => {
        return get().bookmarks.some(b => b.question_id === questionId);
      },

      initializeUser: () => {
        // Device ID is automatically created in api service
        // Apply dark mode class on init
        const isDark = get().isDarkMode;
        document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
      },
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({ language: state.language, isDarkMode: state.isDarkMode }),
    }
  )
);
