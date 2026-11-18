// bring in React's tools, the router, every page, the layout (header) and the login styles
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import ManagePage from './pages/ManagePage';
import SearchPage from './pages/SearchPage';
import NotBuiltPage from './pages/NotBuiltPage';
import Layout from './components/Layout';
import Profile from './pages/Profile';
import './pages/LoginPage.css'; // for the loading screen's layout

export default function App() {
  // user = the logged-in user (null if nobody is logged in); checking = true until the
  // first session check finishes; page = which logged-out screen to show
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

  // while the session check is running, show a simple loading screen
  if (checking) {
    return (
      <main className="login-page">
        <div className="login-form">
          <p>Loading…</p>
        </div>
      </main>
    );
  }

  // if a user is logged in, show the logged-in pages
  if (user) {
    // after logging out: forget the user and go back to the login screen
    function handleLoggedOut() {
      setUser(null);
      setPage('login');
    }

    // Logged in: every page sits inside the Layout (header on top).
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<Layout user={user} onLogout={handleLoggedOut} />}>
            {/* the Library homepage, the "+" page, the profile page and the search page */}
            <Route index element={<HomePage />} />
            <Route path="manage" element={<ManagePage />} />
            <Route path="profile" element={<Profile />} />            
            <Route path="search" element={<SearchPage />} />
            {/* a single deck and a single subdeck: placeholders until those pages are built */}
            <Route path="decks/:deckId" element={<NotBuiltPage title="Deck" />} />
            <Route
              path="decks/:deckId/subdecks/:subdeckId"
              element={<NotBuiltPage title="Subdeck" />}
            />
            {/* any other address: a "Page not found" message */}
            <Route
              path="*"
              element={<NotBuiltPage title="Page not found" message="That page doesn't exist." />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  // not logged in: show the signup screen if the user chose it
  if (page === 'signup') {
    return <SignupPage onSwitchToLogin={() => setPage('login')} />;
  }

  // otherwise show the login screen
  return (
    <LoginPage
      onLogin={setUser}
      onSwitchToSignup={() => setPage('signup')}
    />
  );
}
