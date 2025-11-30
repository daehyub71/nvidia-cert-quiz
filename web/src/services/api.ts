import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { Question, QuizConfig, QuizResult, Bookmark, WrongAnswer, UserStats, Explanation, Language } from '../types';

// Development: localhost, Production: Cloud Run
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;
  private deviceId: string;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.deviceId = this.getOrCreateDeviceId();
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = `web_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  async getRandomQuestions(count: number = 10, category?: string, difficulty?: string): Promise<Question[]> {
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

  async startQuiz(config: QuizConfig): Promise<{ quiz_id: string; questions: Question[] }> {
    const response = await this.client.post(`/api/v1/quiz/start?user_id=${this.deviceId}`, config);
    return response.data;
  }

  async submitQuiz(quizId: string, answers: { question_id: string; selected_answer: number; time_spent_seconds: number }[], totalTimeSeconds: number): Promise<QuizResult> {
    const response = await this.client.post(`/api/v1/quiz/submit?user_id=${this.deviceId}`, {
      quiz_id: quizId,
      answers,
      total_time_seconds: totalTimeSeconds,
    });
    return response.data;
  }

  async getQuizHistory(): Promise<any[]> {
    const response = await this.client.get(`/api/v1/quiz/history?user_id=${this.deviceId}`);
    return response.data;
  }

  async getBookmarks(): Promise<Bookmark[]> {
    const response = await this.client.get(`/api/v1/bookmarks/?user_id=${this.deviceId}`);
    return response.data;
  }

  async addBookmark(questionId: string, note?: string): Promise<Bookmark> {
    const response = await this.client.post(`/api/v1/bookmarks/?user_id=${this.deviceId}`, {
      question_id: questionId,
      note,
    });
    return response.data;
  }

  async removeBookmark(questionId: string): Promise<void> {
    await this.client.delete(`/api/v1/bookmarks/${questionId}?user_id=${this.deviceId}`);
  }

  async getWrongAnswers(): Promise<WrongAnswer[]> {
    const response = await this.client.get(`/api/v1/wrong-answers/?user_id=${this.deviceId}`);
    return response.data;
  }

  async getExplanation(questionId: string, language: Language = 'ko'): Promise<Explanation> {
    const response = await this.client.get(`/api/v1/explanations/${questionId}?language=${language}`);
    return response.data;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await this.client.get(`/api/v1/stats/user/${this.deviceId}`);
    return response.data;
  }

  getDeviceId(): string {
    return this.deviceId;
  }
}

export const api = new ApiService();
export default api;
