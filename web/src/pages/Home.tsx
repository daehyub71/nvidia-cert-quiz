import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Bookmark, BarChart3, GraduationCap, Settings, User } from 'lucide-react';
import { useQuizStore } from '../stores/quizStore';

export default function Home() {
  const navigate = useNavigate();
  const { userStats, bookmarks, wrongAnswers, fetchUserStats, fetchBookmarks, fetchWrongAnswers } = useQuizStore();

  useEffect(() => {
    fetchUserStats();
    fetchBookmarks();
    fetchWrongAnswers();
  }, []);

  const progressPercentage = userStats?.accuracy_percentage || 0;

  return (
    <div className="page safe-top animate-fade-in">
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '16px', gap: '12px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <User size={24} color="var(--color-text-light)" />
        </div>
        <h2 style={{ flex: 1, fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>Exam Prep (NCA-GENL):<br/>NVIDIA-Certified Generative AI LLMs</h2>
        <button className="btn-icon" onClick={() => navigate('/profile')}>
          <Settings size={24} />
        </button>
      </header>

      {/* Headline */}
      <h1 style={{ fontSize: 28, fontWeight: 700, padding: '20px 16px 12px' }}>학습 진도</h1>

      {/* Progress Section */}
      <section style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="text-muted" style={{ fontSize: 16, fontWeight: 500 }}>전체 시험 준비도</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
        <p className="text-muted" style={{ fontSize: 14, marginTop: 12 }}>
          {progressPercentage >= 80
            ? '훌륭합니다! 시험 준비가 잘 되어 있습니다!'
            : progressPercentage >= 50
            ? '좋은 진행 상황입니다. 계속 노력하세요!'
            : '시작이 반입니다. 꾸준히 학습하세요!'}
        </p>
      </section>

      {/* Action Buttons */}
      <section style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>
          새 시험 시작
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/history')}>
          빠른 복습
        </button>
      </section>

      {/* Section Header */}
      <h2 style={{ fontSize: 22, fontWeight: 700, padding: '32px 16px 12px' }}>복습 & 학습</h2>

      {/* Feature Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        padding: '0 16px', paddingBottom: 100
      }}>
        <FeatureCard
          icon={<XCircle size={24} color="var(--color-error)" />}
          iconBg="rgba(239, 68, 68, 0.1)"
          title="오답 노트"
          subtitle={`${wrongAnswers.length}개 문제`}
          onClick={() => navigate('/history')}
        />
        <FeatureCard
          icon={<Bookmark size={24} color="var(--color-bookmark)" />}
          iconBg="rgba(59, 130, 246, 0.1)"
          title="북마크"
          subtitle={`${bookmarks.length}개 문제`}
          onClick={() => navigate('/history')}
        />
        <FeatureCard
          icon={<BarChart3 size={24} color="var(--color-success)" />}
          iconBg="rgba(34, 197, 94, 0.1)"
          title="통계"
          subtitle="성과 보기"
          onClick={() => navigate('/profile')}
        />
        <FeatureCard
          icon={<GraduationCap size={24} color="var(--color-study)" />}
          iconBg="rgba(168, 85, 247, 0.1)"
          title="학습 모드"
          subtitle="자유롭게 학습"
          onClick={() => navigate('/topics')}
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, subtitle, onClick }: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        height: 128, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div>
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
        }}>
          {icon}
        </div>
        <h3 style={{ fontWeight: 700 }}>{title}</h3>
      </div>
      <p className="text-muted" style={{ fontSize: 14 }}>{subtitle}</p>
    </div>
  );
}
