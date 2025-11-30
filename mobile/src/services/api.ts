/**
 * API service for NVIDIA Cert Quiz backend
 */
import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Question,
  QuizConfig,
  QuizResult,
  Bookmark,
  WrongAnswer,
  UserStats,
  Explanation,
  Language,
} from '../types';

// API base URL - Cloud Run deployed backend
const API_BASE_URL = 'https://nvidia-cert-quiz-api-675597240676.asia-northeast3.run.app';

class ApiService {
  private client: AxiosInstance;
  private deviceId: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initDeviceId();
  }

  private async initDeviceId() {
    let deviceId = await AsyncStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await AsyncStorage.setItem('device_id', deviceId);
    }
    this.deviceId = deviceId;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; environment: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Questions API
  async getRandomQuestions(
    count: number = 10,
    category?: string,
    difficulty?: string
  ): Promise<Question[]> {
    const params = new URLSearchParams();
    params.append('count', count.toString());
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);

    const response = await this.client.get(`/api/v1/questions/random?${params.toString()}`);
    return response.data;
  }

  async getCategories(): Promise<string[]> {
    const response = await this.client.get('/api/v1/questions/categories');
    return response.data.categories;
  }

  async getQuestion(questionId: string): Promise<Question> {
    const response = await this.client.get(`/api/v1/questions/${questionId}`);
    return response.data;
  }

  // Quiz API
  async startQuiz(config: QuizConfig): Promise<{ quiz_id: string; questions: Question[] }> {
    const response = await this.client.post('/api/v1/quiz/start', {
      user_id: this.deviceId,
      ...config,
    });
    return response.data;
  }

  async submitQuiz(
    quizId: string,
    answers: { question_id: string; selected_answer: number; time_spent_seconds: number }[],
    totalTimeSeconds: number
  ): Promise<QuizResult> {
    const response = await this.client.post('/api/v1/quiz/submit', {
      quiz_id: quizId,
      answers,
      total_time_seconds: totalTimeSeconds,
    });
    return response.data;
  }

  async getQuizHistory(): Promise<any[]> {
    const response = await this.client.get(`/api/v1/quiz/history/${this.deviceId}`);
    return response.data;
  }

  // Bookmarks API
  async getBookmarks(): Promise<Bookmark[]> {
    const response = await this.client.get(`/api/v1/bookmarks/${this.deviceId}`);
    return response.data;
  }

  async addBookmark(questionId: string, note?: string): Promise<Bookmark> {
    const response = await this.client.post('/api/v1/bookmarks', {
      user_id: this.deviceId,
      question_id: questionId,
      note,
    });
    return response.data;
  }

  async removeBookmark(questionId: string): Promise<void> {
    await this.client.delete(`/api/v1/bookmarks/${this.deviceId}/${questionId}`);
  }

  // Wrong Answers API
  async getWrongAnswers(): Promise<WrongAnswer[]> {
    const response = await this.client.get(`/api/v1/wrong-answers/${this.deviceId}`);
    return response.data;
  }

  async markWrongAnswerReviewed(wrongAnswerId: string): Promise<void> {
    await this.client.put(`/api/v1/wrong-answers/${wrongAnswerId}/review`);
  }

  // Explanations API
  async getExplanation(questionId: string, language: Language = 'ko'): Promise<Explanation> {
    const response = await this.client.get(`/api/v1/explanations/${questionId}?language=${language}`);
    return response.data;
  }

  // Stats API
  async getUserStats(): Promise<UserStats> {
    const response = await this.client.get(`/api/v1/stats/${this.deviceId}`);
    return response.data;
  }

  // Getter for device ID
  getDeviceId(): string {
    return this.deviceId;
  }
}

export const api = new ApiService();
export default api;
