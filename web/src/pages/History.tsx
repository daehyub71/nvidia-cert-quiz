import { useEffect, useState } from 'react';
import { useQuizStore } from '../stores/quizStore';
import { Bookmark, CheckCircle, ChevronRight, ChevronDown, XCircle, Lightbulb, Loader } from 'lucide-react';
import api from '../services/api';
import type { Question } from '../types';

type Tab = 'history' | 'wrong' | 'bookmarks';

export default function History() {
  const { wrongAnswers, bookmarks, fetchWrongAnswers, fetchBookmarks, language } = useQuizStore();
  const [tab, setTab] = useState<Tab>('wrong');
  const [expandedWrong, setExpandedWrong] = useState<Set<string>>(new Set());
  const [expandedBookmark, setExpandedBookmark] = useState<Set<string>>(new Set());
  const [bookmarkQuestions, setBookmarkQuestions] = useState<Record<string, Question>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanations, setLoadingExplanations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWrongAnswers();
    fetchBookmarks();
  }, []);

  const toggleWrong = (id: string) => {
    setExpandedWrong(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleBookmark = async (id: string, questionId: string) => {
    setExpandedBookmark(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });

    // Load question if not already loaded
    if (!bookmarkQuestions[questionId]) {
      try {
        const question = await api.getQuestion(questionId);
        setBookmarkQuestions(prev => ({ ...prev, [questionId]: question }));
      } catch (e) {
        console.error('Failed to load question:', e);
      }
    }
  };

  const loadExplanation = async (questionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card toggle
    if (explanations[questionId] || loadingExplanations.has(questionId)) return;

    setLoadingExplanations(prev => new Set(prev).add(questionId));
    try {
      const exp = await api.getExplanation(questionId, language);
      setExplanations(prev => ({
        ...prev,
        [questionId]: language === 'ko' ? exp.explanation_ko : exp.explanation_en,
      }));
    } catch (error) {
      console.error('Failed to load explanation:', error);
      setExplanations(prev => ({
        ...prev,
        [questionId]: '해설을 불러오는데 실패했습니다.',
      }));
    } finally {
      setLoadingExplanations(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'wrong', label: '오답 노트', count: wrongAnswers.length },
    { key: 'bookmarks', label: '북마크', count: bookmarks.length },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="page safe-top animate-fade-in">
      <header style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>학습 기록</h1>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px', marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none',
              backgroundColor: tab === t.key ? 'rgba(118, 185, 0, 0.1)' : 'var(--surface)',
              color: tab === t.key ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            {t.label}
            <span style={{
              backgroundColor: tab === t.key ? 'var(--color-primary)' : 'var(--text-muted)',
              color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: 12,
            }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: '0 16px 100px' }}>
        {tab === 'wrong' && (
          wrongAnswers.length === 0 ? (
            <EmptyState icon={<CheckCircle size={48} color="var(--color-success)" />} title="틀린 문제가 없습니다" subtitle="완벽해요! 계속 이 기세로 가세요" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {wrongAnswers.map((w, idx) => {
                const isExpanded = expandedWrong.has(w.id);
                const q = w.question;
                const questionText = language === 'ko' ? q?.question_text_ko : q?.question_text_en;
                const options = language === 'ko' ? q?.options_ko : q?.options_en;
                return (
                  <div key={w.id} className="card" style={{ cursor: 'pointer' }} onClick={() => toggleWrong(w.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: 4,
                        backgroundColor: w.reviewed ? 'var(--color-success)' : 'var(--color-error)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500 }}>{questionText?.slice(0, 50) || `문제 ${idx + 1}`}...</p>
                        <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(w.created_at)}</span>
                      </div>
                      {isExpanded ? <ChevronDown size={20} className="text-muted" /> : <ChevronRight size={20} className="text-muted" />}
                    </div>
                    {isExpanded && q && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <p style={{ marginBottom: 16, lineHeight: 1.5 }}>{questionText}</p>
                        {options?.map((opt, i) => (
                          <div key={i} style={{
                            padding: '8px 12px', marginBottom: 8, borderRadius: 8,
                            backgroundColor: i === q.correct_answer ? 'rgba(34, 197, 94, 0.1)' : i === w.selected_answer ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface)',
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            {i === q.correct_answer && <CheckCircle size={16} color="var(--color-success)" />}
                            {i === w.selected_answer && i !== q.correct_answer && <XCircle size={16} color="var(--color-error)" />}
                            <span style={{ color: i === q.correct_answer ? 'var(--color-success)' : i === w.selected_answer ? 'var(--color-error)' : 'inherit' }}>{opt}</span>
                          </div>
                        ))}

                        {/* Explanation section */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                          {explanations[q.id] ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <Lightbulb size={18} color="var(--color-warning)" />
                                <span style={{ fontWeight: 600, fontSize: 14 }}>해설</span>
                              </div>
                              <p className="text-muted" style={{ lineHeight: 1.6, fontSize: 14 }}>
                                {explanations[q.id]}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => loadExplanation(q.id, e)}
                              disabled={loadingExplanations.has(q.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px', borderRadius: 8, border: 'none',
                                backgroundColor: 'rgba(118, 185, 0, 0.1)',
                                color: 'var(--color-primary)',
                                cursor: loadingExplanations.has(q.id) ? 'wait' : 'pointer',
                                fontSize: 14, fontWeight: 500,
                              }}
                            >
                              {loadingExplanations.has(q.id) ? (
                                <><Loader size={16} className="spinner" /> 해설 로딩 중...</>
                              ) : (
                                <><Lightbulb size={16} /> 해설 보기</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'bookmarks' && (
          bookmarks.length === 0 ? (
            <EmptyState icon={<Bookmark size={48} className="text-muted" />} title="북마크가 없습니다" subtitle="시험 중 북마크 버튼을 눌러 저장하세요" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookmarks.map((b, idx) => {
                const isExpanded = expandedBookmark.has(b.id);
                const q = bookmarkQuestions[b.question_id];
                const questionText = q ? (language === 'ko' ? q.question_text_ko : q.question_text_en) : null;
                const options = q ? (language === 'ko' ? q.options_ko : q.options_en) : null;
                return (
                  <div key={b.id} className="card" style={{ cursor: 'pointer' }} onClick={() => toggleBookmark(b.id, b.question_id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Bookmark size={24} color="var(--color-bookmark)" />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 500 }}>{questionText?.slice(0, 50) || `북마크 #${idx + 1}`}{questionText && '...'}</p>
                        {b.note && <span className="text-muted" style={{ fontSize: 12 }}>{b.note}</span>}
                      </div>
                      {isExpanded ? <ChevronDown size={20} className="text-muted" /> : <ChevronRight size={20} className="text-muted" />}
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        {q ? (
                          <>
                            <p style={{ marginBottom: 16, lineHeight: 1.5 }}>{questionText}</p>
                            {options?.map((opt, i) => (
                              <div key={i} style={{
                                padding: '8px 12px', marginBottom: 8, borderRadius: 8,
                                backgroundColor: i === q.correct_answer ? 'rgba(34, 197, 94, 0.1)' : 'var(--surface)',
                                display: 'flex', alignItems: 'center', gap: 8,
                              }}>
                                {i === q.correct_answer && <CheckCircle size={16} color="var(--color-success)" />}
                                <span style={{ color: i === q.correct_answer ? 'var(--color-success)' : 'inherit' }}>{opt}</span>
                              </div>
                            ))}

                            {/* Explanation section */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
                              {explanations[q.id] ? (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Lightbulb size={18} color="var(--color-warning)" />
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>해설</span>
                                  </div>
                                  <p className="text-muted" style={{ lineHeight: 1.6, fontSize: 14 }}>
                                    {explanations[q.id]}
                                  </p>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => loadExplanation(q.id, e)}
                                  disabled={loadingExplanations.has(q.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '8px 12px', borderRadius: 8, border: 'none',
                                    backgroundColor: 'rgba(118, 185, 0, 0.1)',
                                    color: 'var(--color-primary)',
                                    cursor: loadingExplanations.has(q.id) ? 'wait' : 'pointer',
                                    fontSize: 14, fontWeight: 500,
                                  }}
                                >
                                  {loadingExplanations.has(q.id) ? (
                                    <><Loader size={16} className="spinner" /> 해설 로딩 중...</>
                                  ) : (
                                    <><Lightbulb size={16} /> 해설 보기</>
                                  )}
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-muted">로딩 중...</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{title}</h3>
      <p className="text-muted">{subtitle}</p>
    </div>
  );
}
