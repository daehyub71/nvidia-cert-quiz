import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import { Brain, Database, MessageSquare, Eye, BarChart, Settings, ChevronRight, Cpu, Zap, Target, Code, AlertCircle, Loader } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'deep': <Brain size={24} />,
  'machine': <Cpu size={24} />,
  'nlp': <MessageSquare size={24} />,
  'language': <MessageSquare size={24} />,
  'vision': <Eye size={24} />,
  'data': <Database size={24} />,
  'train': <Zap size={24} />,
  'eval': <BarChart size={24} />,
  'metric': <Target size={24} />,
  'ethic': <Settings size={24} />,
  'deploy': <Code size={24} />,
  'prompt': <MessageSquare size={24} />,
};

const colors = ['#76B900', '#3B82F6', '#A855F7', '#22C55E', '#F59E0B', '#EF4444'];

export default function Topics() {
  const navigate = useNavigate();
  const { categories, fetchCategories, language, startQuiz } = useQuizStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = async (category: string) => {
    setLoading(category);
    setError(null);

    // Try with decreasing question counts: 5, 3, 2, 1
    const questionCounts = [5, 3, 2, 1];

    for (const count of questionCounts) {
      try {
        await startQuiz({
          question_count: count,
          language,
          categories: [category],
        });
        navigate('/exam');
        return;
      } catch (err: any) {
        // If not enough questions, try with fewer
        if (err.response?.data?.detail?.includes('Not enough questions')) {
          continue;
        }
        // Other errors - show message
        console.error('Failed to start quiz:', err);
        setError(`퀴즈 시작 실패: ${err.response?.data?.detail || err.message}`);
        setLoading(null);
        return;
      }
    }

    // No questions at all in this category
    setError(`"${category}" 카테고리에 문제가 없습니다.`);
    setLoading(null);
  };

  const getIcon = (cat: string) => {
    const lower = cat.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return <Brain size={24} />;
  };

  const getColor = (idx: number) => colors[idx % colors.length];

  return (
    <div className="page safe-top animate-fade-in">
      <header style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>주제별 학습</h1>
        <p className="text-muted" style={{ fontSize: 16, marginTop: 4 }}>{categories.length}개 카테고리</p>
      </header>

      {/* Error message */}
      {error && (
        <div style={{
          margin: '0 16px 16px',
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <AlertCircle size={20} color="var(--color-error)" />
          <span style={{ color: 'var(--color-error)', fontSize: 14 }}>{error}</span>
        </div>
      )}

      <div style={{ padding: '0 16px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {categories.map((cat, idx) => {
          const color = getColor(idx);
          const isLoading = loading === cat;
          return (
            <div
              key={cat}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: isLoading ? 'wait' : 'pointer',
                transition: 'transform 0.2s',
                opacity: loading && !isLoading ? 0.5 : 1,
              }}
              onClick={() => !loading && handleCategoryClick(cat)}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateX(4px)')}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                backgroundColor: `${color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: color,
              }}>
                {isLoading ? <Loader size={24} className="spinner" /> : getIcon(cat)}
              </div>
              <span style={{ flex: 1, fontWeight: 600 }}>{cat}</span>
              <ChevronRight size={20} className="text-muted" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
