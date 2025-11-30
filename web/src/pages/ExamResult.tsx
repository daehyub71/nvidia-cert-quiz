import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, RotateCcw, CheckCircle, XCircle, Lightbulb, Loader, Languages } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';
import type { QuizResult, Explanation } from '../types';
import api from '../services/api';

export default function ExamResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetQuiz, retakeQuiz, language, setLanguage } = useQuizStore();

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };
  const result = location.state?.result as QuizResult;

  // Store both language versions for dynamic switching
  const [explanations, setExplanations] = useState<Record<string, Explanation>>({});
  const [loading, setLoading] = useState<Set<string>>(new Set());

  if (!result) {
    navigate('/');
    return null;
  }

  const percentage = result.percentage;
  const isPassing = percentage >= 70;

  const getScoreColor = () => {
    if (percentage >= 80) return 'var(--color-success)';
    if (percentage >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getEmoji = () => {
    if (percentage >= 90) return '🎉';
    if (percentage >= 80) return '👏';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '💪';
    return '📚';
  };

  const handleGoHome = () => {
    resetQuiz();
    navigate('/');
  };

  const handleRetake = () => {
    retakeQuiz();
    navigate('/exam');
  };

  const loadExplanation = async (qId: string) => {
    if (explanations[qId] || loading.has(qId)) return;

    setLoading(prev => new Set(prev).add(qId));
    try {
      const exp = await api.getExplanation(qId, language);
      // Store the full explanation object with both languages
      setExplanations(prev => ({
        ...prev,
        [qId]: exp,
      }));
    } catch (e) {
      console.error(e);
      // Store error message in both languages
      setExplanations(prev => ({
        ...prev,
        [qId]: {
          question_id: qId,
          explanation_en: 'Failed to load explanation',
          explanation_ko: '해설을 불러오는데 실패했습니다',
          created_at: new Date().toISOString(),
        },
      }));
    } finally {
      setLoading(prev => { const n = new Set(prev); n.delete(qId); return n; });
    }
  };

  return (
    <div className="page safe-top animate-slide-up" style={{ paddingBottom: 24 }}>
      <header style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 60 }} /> {/* Spacer for centering */}
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          {language === 'ko' ? '시험 결과' : 'Exam Results'}
        </h1>
        <button
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 8,
            backgroundColor: 'rgba(118, 185, 0, 0.15)',
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid var(--color-primary)',
            cursor: 'pointer',
          }}
        >
          <Languages size={16} />
          {language === 'ko' ? '한글' : 'EN'}
        </button>
      </header>

      {/* Score Card */}
      <div className="card" style={{ margin: '0 16px', padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{getEmoji()}</div>
        <div style={{ fontSize: 56, fontWeight: 700, color: getScoreColor() }}>
          {Math.round(percentage)}%
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>
          {result.score} / {result.total_questions} {language === 'ko' ? '정답' : 'Correct'}
        </div>
        <p className="text-muted" style={{ marginTop: 12 }}>
          {isPassing
            ? (language === 'ko' ? '합격 기준을 통과했습니다!' : 'You passed!')
            : (language === 'ko' ? '조금 더 노력이 필요합니다. 화이팅!' : 'Keep practicing! You can do it!')}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, padding: '24px 16px' }}>
        <button className="btn btn-primary" onClick={handleRetake} style={{ flex: 1 }}>
          <RotateCcw size={18} /> {language === 'ko' ? '다시 도전' : 'Retry'}
        </button>
        <button className="btn btn-secondary" onClick={handleGoHome} style={{ flex: 1 }}>
          <Home size={18} /> {language === 'ko' ? '홈으로' : 'Home'}
        </button>
      </div>

      {/* Results List - All questions shown expanded by default */}
      <h2 style={{ fontSize: 20, fontWeight: 700, padding: '0 16px', marginBottom: 16 }}>
        {language === 'ko' ? '문제별 결과' : 'Results by Question'}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
        {result.results.map((item, idx) => {
          // Use language-specific fields for dynamic switching
          const questionText = language === 'ko'
            ? (item.question_text_ko || item.question_text)
            : (item.question_text_en || item.question_text);
          const options = language === 'ko'
            ? (item.options_ko || item.options)
            : (item.options_en || item.options);
          const explanation = explanations[item.question_id];
          const explanationText = explanation
            ? (language === 'ko' ? explanation.explanation_ko : explanation.explanation_en)
            : null;

          return (
            <div key={item.question_id} className="card">
              {/* Header with result indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: item.is_correct ? 'var(--color-success)' : 'var(--color-error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.is_correct ? <CheckCircle size={16} color="#fff" /> : <XCircle size={16} color="#fff" />}
                </div>
                <span style={{ fontWeight: 600 }}>
                  {language === 'ko' ? `문제 ${idx + 1}` : `Question ${idx + 1}`}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: item.is_correct ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: item.is_correct ? 'var(--color-success)' : 'var(--color-error)',
                }}>
                  {item.is_correct ? (language === 'ko' ? '정답' : 'Correct') : (language === 'ko' ? '오답' : 'Wrong')}
                </span>
              </div>

              {/* Question text */}
              <p style={{ marginBottom: 16, lineHeight: 1.5, fontSize: 15 }}>{questionText}</p>

              {/* Correct answer */}
              <div style={{ marginBottom: 8 }}>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {language === 'ko' ? '정답:' : 'Correct Answer:'}
                </span>
                <p style={{ color: 'var(--color-success)', fontWeight: 600, marginTop: 4 }}>
                  {options[item.correct_answer]}
                </p>
              </div>

              {/* Wrong answer if applicable */}
              {!item.is_correct && (
                <div style={{ marginBottom: 8 }}>
                  <span className="text-muted" style={{ fontSize: 13 }}>
                    {language === 'ko' ? '내 답변:' : 'Your Answer:'}
                  </span>
                  <p style={{ color: 'var(--color-error)', fontWeight: 600, marginTop: 4 }}>
                    {options[item.selected_answer]}
                  </p>
                </div>
              )}

              {/* Explanation section - loads on demand */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                {explanationText ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Lightbulb size={18} color="var(--color-warning)" />
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {language === 'ko' ? '해설' : 'Explanation'}
                      </span>
                    </div>
                    <p className="text-muted" style={{ lineHeight: 1.6, fontSize: 14 }}>
                      {explanationText}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => loadExplanation(item.question_id)}
                    disabled={loading.has(item.question_id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: 'rgba(118, 185, 0, 0.1)',
                      color: 'var(--color-primary)',
                      cursor: loading.has(item.question_id) ? 'wait' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {loading.has(item.question_id) ? (
                      <>
                        <Loader size={16} className="spinner" />
                        {language === 'ko' ? '해설 로딩 중...' : 'Loading...'}
                      </>
                    ) : (
                      <>
                        <Lightbulb size={16} />
                        {language === 'ko' ? '해설 보기' : 'Show Explanation'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
