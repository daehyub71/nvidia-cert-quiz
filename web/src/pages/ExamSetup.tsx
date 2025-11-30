import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';
import type { Difficulty } from '../types';

const QUESTION_COUNTS = [1, 3, 5, 10];
const DIFFICULTIES: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
];

export default function ExamSetup() {
  const navigate = useNavigate();
  const { categories, fetchCategories, startQuiz, language, isLoading } = useQuizStore();

  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleStart = async () => {
    try {
      await startQuiz({
        question_count: questionCount,
        language,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        difficulty: difficulty !== 'all' ? difficulty : undefined,
      });
      navigate('/exam');
    } catch (error) {
      console.error('Failed to start quiz:', error);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="page safe-top animate-slide-up" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button className="btn-icon" onClick={() => navigate('/')}>
          <X size={28} />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>시험 설정</h1>
        <div style={{ width: 44 }} />
      </header>

      <div style={{ padding: '0 16px', overflowY: 'auto', height: 'calc(100vh - 180px)' }}>
        {/* Question Count */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>문제 수</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 12 }}>시험에 포함할 문제 수를 선택하세요</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {QUESTION_COUNTS.map(count => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                style={{
                  padding: '12px 20px', borderRadius: 12, fontWeight: 600,
                  backgroundColor: questionCount === count ? 'rgba(118, 185, 0, 0.1)' : 'var(--surface)',
                  border: `2px solid ${questionCount === count ? 'var(--color-primary)' : 'transparent'}`,
                  color: questionCount === count ? 'var(--color-primary)' : 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {count}문제
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>난이도</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 12 }}>원하는 난이도를 선택하세요</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d.value}
                onClick={() => setDifficulty(d.value)}
                style={{
                  padding: '12px 20px', borderRadius: 12, fontWeight: 600,
                  backgroundColor: difficulty === d.value ? 'rgba(118, 185, 0, 0.1)' : 'var(--surface)',
                  border: `2px solid ${difficulty === d.value ? 'var(--color-primary)' : 'transparent'}`,
                  color: difficulty === d.value ? 'var(--color-primary)' : 'var(--text)',
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section style={{ marginBottom: 24 }}>
          <div
            onClick={() => setShowCategories(!showCategories)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>카테고리 선택</h2>
              <p className="text-muted" style={{ fontSize: 14 }}>
                {selectedCategories.length === 0 ? '전체 카테고리' : `${selectedCategories.length}개 선택됨`}
              </p>
            </div>
            {showCategories ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>

          {showCategories && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {categories.map(cat => (
                <div
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, borderRadius: 12, cursor: 'pointer',
                    backgroundColor: selectedCategories.includes(cat) ? 'rgba(118, 185, 0, 0.1)' : 'var(--surface)',
                    border: `2px solid ${selectedCategories.includes(cat) ? 'var(--color-primary)' : 'transparent'}`,
                  }}
                >
                  <span style={{ color: selectedCategories.includes(cat) ? 'var(--color-primary)' : 'var(--text)', fontWeight: selectedCategories.includes(cat) ? 600 : 400 }}>
                    {cat}
                  </span>
                  {selectedCategories.includes(cat) && <Check size={20} color="var(--color-primary)" />}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Summary Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>시험 요약</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="text-muted">문제 수</span>
            <span style={{ fontWeight: 600 }}>{questionCount}문제</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="text-muted">난이도</span>
            <span style={{ fontWeight: 600 }}>{DIFFICULTIES.find(d => d.value === difficulty)?.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="text-muted">카테고리</span>
            <span style={{ fontWeight: 600 }}>{selectedCategories.length === 0 ? '전체' : `${selectedCategories.length}개`}</span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '16px', paddingBottom: 32, backgroundColor: 'var(--bg)' }}>
        <button className="btn btn-primary" onClick={handleStart} disabled={isLoading}>
          {isLoading ? <div className="spinner" /> : <><Play size={20} /> 시험 시작</>}
        </button>
      </div>
    </div>
  );
}
