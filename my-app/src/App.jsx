import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import StudyPage from './pages/StudyPage';
import './pages/LoginPage.css'; // for the loading screen's layout

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState('login'); // 'login' or 'signup'

  // On load (and on refresh), ask the server if there is already a session.
  useEffect(() => {
    fetch('/api/users/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <main className="login-page">
        <div className="login-form">
          <p>Loading…</p>
        </div>
      </main>
    );
  }

  if (user && window.location.pathname === '/study') {
    return <StudyPage />;
  }

  if (user) {
    return (
      <HomePage
        user={user}
        onLogout={() => {
          setUser(null);
          setPage('login');
        }}
      />
    );
  }

  if (page === 'signup') {
    return <SignupPage onSwitchToLogin={() => setPage('login')} />;
  }

  return (
    <LoginPage
      onLogin={setUser}
      onSwitchToSignup={() => setPage('signup')}
    />
  );
}
