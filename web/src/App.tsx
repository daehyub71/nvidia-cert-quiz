import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, History, User } from 'lucide-react';
import { useQuizStore } from './stores/quizStore';

import HomePage from './pages/Home';
import ExamSetup from './pages/ExamSetup';
import ExamSession from './pages/ExamSession';
import ExamResult from './pages/ExamResult';
import Topics from './pages/Topics';
import HistoryPage from './pages/History';
import Profile from './pages/Profile';

import './index.css';

function TabBar() {
  const location = useLocation();
  const pathname = location.pathname;

  // Hide tab bar during exam session
  if (pathname === '/exam' || pathname === '/result') {
    return null;
  }

  const tabs = [
    { path: '/', icon: HomeIcon, label: '홈' },
    { path: '/topics', icon: BookOpen, label: '카테고리' },
    { path: '/history', icon: History, label: '기록' },
    { path: '/profile', icon: User, label: '프로필' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'var(--surface)',
      borderTop: '1px solid rgba(100, 116, 139, 0.2)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))',
      zIndex: 100,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              padding: '4px 16px',
            }}
          >
            <Icon size={24} />
            <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function AppContent() {
  const { isDarkMode, initializeUser } = useQuizStore();

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text)',
    }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/setup" element={<ExamSetup />} />
        <Route path="/exam" element={<ExamSession />} />
        <Route path="/result" element={<ExamResult />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
