import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Check, Timer, Languages } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';

export default function ExamSession() {
  const navigate = useNavigate();
  const {
    language, setLanguage, currentQuestions, currentQuestionIndex, answers,
    answerQuestion, nextQuestion, previousQuestion, submitQuiz,
    isBookmarked, addBookmark, removeBookmark, isLoading,
  } = useQuizStore();

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const isLast = currentQuestionIndex === currentQuestions.length - 1;
  const isFirst = currentQuestionIndex === 0;
  const bookmarked = currentQuestion ? isBookmarked(currentQuestion.id) : false;

  useEffect(() => {
    if (!currentQuestion) {
      navigate('/');
      return;
    }
    const timer = setInterval(() => setElapsedTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      const existing = answers.find(a => a.question_id === currentQuestion.id);
      setSelectedAnswer(existing ? existing.selected_answer : null);
    }
  }, [currentQuestionIndex, currentQuestion, answers]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSelect = (idx: number) => {
    setSelectedAnswer(idx);
    answerQuestion(idx);
  };

  const handleNext = async () => {
    if (isLast) {
      if (confirm('시험을 제출하시겠습니까?')) {
        const result = await submitQuiz();
        if (result) navigate('/result', { state: { result } });
      }
    } else {
      nextQuestion();
    }
  };

  const handleQuit = () => {
    if (confirm('시험을 종료하시겠습니까? 진행 상황이 저장되지 않습니다.')) {
      navigate('/');
    }
  };

  const toggleBookmark = async () => {
    if (!currentQuestion) return;
    if (bookmarked) await removeBookmark(currentQuestion.id);
    else await addBookmark(currentQuestion.id);
  };

  if (!currentQuestion) return null;

  // Use language-specific fields for real-time language switching
  const questionText = language === 'ko'
    ? (currentQuestion.question_text_ko || currentQuestion.question_text)
    : (currentQuestion.question_text_en || currentQuestion.question_text);
  const options = language === 'ko'
    ? (currentQuestion.options_ko || currentQuestion.options)
    : (currentQuestion.options_en || currentQuestion.options);

  return (
    <div className="page safe-top animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: 0 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button className="btn-icon" onClick={handleQuit}>
          <X size={24} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{currentQuestionIndex + 1} / {currentQuestions.length}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-primary)', fontSize: 14 }}>
            <Timer size={16} /> {formatTime(elapsedTime)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Language Toggle */}
          <button
            className="btn-icon"
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
            }}
          >
            <Languages size={16} />
            {language === 'ko' ? '한글' : 'EN'}
          </button>
          <button className="btn-icon" onClick={toggleBookmark}>
            {bookmarked ? <BookmarkCheck size={24} color="var(--color-bookmark)" /> : <Bookmark size={24} />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className="progress-bar-fill" style={{ width: `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <span className="badge badge-primary" style={{ marginBottom: 16 }}>{currentQuestion.category}</span>
        <h2 style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, marginBottom: 24 }}>{questionText}</h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 120 }}>
          {options?.map((opt, idx) => (
            <div
              key={idx}
              className={`option-item ${selectedAnswer === idx ? 'selected' : ''}`}
              onClick={() => handleSelect(idx)}
            >
              <div className="option-radio">
                <div className="option-radio-inner" />
              </div>
              <span className="option-text">{opt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480, padding: 16,
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 16px))',
        backgroundColor: 'var(--bg)', display: 'flex', gap: 12,
      }}>
        <button
          className="btn"
          onClick={previousQuestion}
          disabled={isFirst}
          style={{
            flex: 1, backgroundColor: 'var(--surface)',
            opacity: isFirst ? 0.5 : 1, color: 'var(--text)',
          }}
        >
          <ChevronLeft size={20} /> 이전
        </button>
        <button className="btn btn-primary" onClick={handleNext} disabled={isLoading} style={{ flex: 1 }}>
          {isLoading ? <div className="spinner" /> : (
            <>{isLast ? '제출' : '다음'} {isLast ? <Check size={20} /> : <ChevronRight size={20} />}</>
          )}
        </button>
      </div>
    </div>
  );
}
