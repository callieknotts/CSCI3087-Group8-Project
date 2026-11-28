import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ManagePage from './pages/ManagePage';
import SearchPage from './pages/SearchPage';
import NotBuiltPage from './pages/NotBuiltPage';
import DeckPage from './pages/DeckPage';
import SubdeckPage from './pages/SubdeckPage';
import FlashcardPage from './pages/FlashcardPage';
import StarredPage from './pages/StarredPage';
import RepetitionPage from './pages/RepetitionPage';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import './pages/LoginPage.css'; // for the loading screen's layout

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [page, setPage] = useState('login'); // 'login' or 'signup'

  // On load (and on refresh), ask the server if there is already a session.
  useEffect(() => {
    fetch('/api/users/me', {
      credentials: 'include',
    })
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

  if (user) {
    function handleLoggedOut() {
      setUser(null);
      setPage('login');
    }

    // Logged in: every page sits inside the Layout (header on top).
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Layout user={user} onLogout={handleLoggedOut} />}>
            <Route index element={<HomePage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="profile" element={<Profile />} />            
            <Route path="search" element={<SearchPage />} />
            <Route path="decks/:deckId" element={<DeckPage />} />
            <Route path="decks/:deckId/flashcards" element={<FlashcardPage />} />
            <Route path="decks/:deckId/subdecks/:subdeckId" element={<SubdeckPage />} />
            <Route
              path="decks/:deckId/subdecks/:subdeckId/flashcards"
              element={<FlashcardPage />}
            />
            <Route path="flashcards/starred" element={<FlashcardPage />} />
            <Route path="flashcards/starred/repetition" element={<RepetitionPage />} />
            <Route path="starred" element={<StarredPage />} />
            <Route path="decks/:deckId/starred" element={<StarredPage />} />
            <Route path="decks/:deckId/subdecks/:subdeckId/starred" element={<StarredPage />} />
            <Route path="decks/:deckId/repetition" element={<RepetitionPage />} />
            <Route
              path="decks/:deckId/subdecks/:subdeckId/repetition"
              element={<RepetitionPage />}
            />
            <Route
              path="*"
              element={<NotBuiltPage title="Page not found" message="That page doesn't exist." />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
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