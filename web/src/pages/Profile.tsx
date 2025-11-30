import { useEffect } from 'react';
import { useQuizStore } from '../stores/quizStore';
import { User, Moon, Sun, Globe, Info, HelpCircle, Award } from 'lucide-react';

export default function Profile() {
  const {
    isDarkMode,
    language,
    userStats,
    toggleDarkMode,
    setLanguage,
    fetchUserStats,
  } = useQuizStore();

  useEffect(() => {
    fetchUserStats();
  }, []);

  const stats = [
    { label: '완료한 시험', value: userStats?.total_quizzes || 0, icon: <Award size={24} /> },
    { label: '푼 문제', value: userStats?.total_questions_answered || 0, icon: <HelpCircle size={24} /> },
    { label: '정답', value: userStats?.correct_answers || 0, icon: <Info size={24} /> },
    { label: '정답률', value: `${Math.round(userStats?.accuracy_percentage || 0)}%`, icon: <Award size={24} /> },
  ];

  return (
    <div className="page safe-top animate-fade-in">
      <header style={{ padding: '24px 16px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>프로필</h1>
      </header>

      {/* Profile Card */}
      <div className="card" style={{ margin: '0 16px', textAlign: 'center', padding: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <User size={40} color="#fff" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>NVIDIA 인증 준비생</h2>
        <p className="text-muted">열심히 공부 중!</p>
      </div>

      {/* Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        padding: '16px',
      }}>
        {stats.map((stat, index) => (
          <div key={index} className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ color: 'var(--color-primary)', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{stat.value}</div>
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Settings Section */}
      <section style={{ padding: '0 16px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>설정</h3>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Language Setting */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderBottom: '1px solid var(--text-muted)', borderBottomWidth: 0.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Globe size={24} className="text-muted" />
              <span>언어</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setLanguage('ko')}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  backgroundColor: language === 'ko' ? 'var(--color-primary)' : 'var(--surface)',
                  color: language === 'ko' ? '#fff' : 'var(--text-muted)',
                  fontWeight: language === 'ko' ? 600 : 400,
                }}
              >
                한국어
              </button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  backgroundColor: language === 'en' ? 'var(--color-primary)' : 'var(--surface)',
                  color: language === 'en' ? '#fff' : 'var(--text-muted)',
                  fontWeight: language === 'en' ? 600 : 400,
                }}
              >
                English
              </button>
            </div>
          </div>

          {/* Dark Mode Setting */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {isDarkMode ? <Moon size={24} className="text-muted" /> : <Sun size={24} className="text-muted" />}
              <span>다크 모드</span>
            </div>
            <button
              onClick={toggleDarkMode}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                backgroundColor: isDarkMode ? 'var(--color-primary)' : '#ccc',
                position: 'relative', transition: 'background-color 0.2s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: 2, left: isDarkMode ? 26 : 2,
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section style={{ padding: '24px 16px 100px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>정보</h3>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, borderBottom: '1px solid var(--text-muted)', borderBottomWidth: 0.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Info size={24} className="text-muted" />
              <span>앱 버전</span>
            </div>
            <span className="text-muted">1.0.0</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <HelpCircle size={24} className="text-muted" />
              <span>도움말</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
