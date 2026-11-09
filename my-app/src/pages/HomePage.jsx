import { useState } from 'react';
import Button from '../components/Button';
import './LoginPage.css';
import './HomePage.css';

const LOGOUT_URL = '/api/users/logout';

export default function HomePage({ user, onLogout }) {
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(LOGOUT_URL, {
        method: 'DELETE',
        credentials: 'include',
      });

      // 401 :session is already gone (treats it as logged out too)
      if (!res.ok && res.status !== 401) {
        setFormError('Could not log out. Try again.');
        return;
      }

      onLogout();
    } catch {
      setFormError('Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page home-page">
      <header className="top-bar">
        <div className="user-badge">
          <span className="user-badge__name">{user.name}</span>
          <svg
            className="user-badge__icon"
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3.2" />
            <path d="M5.6 18.4c1.6-2.4 3.9-3.6 6.4-3.6s4.8 1.2 6.4 3.6" />
          </svg>
        </div>
      </header>

      <div className="login-form">
        <h2 className="app-title">Rebel Review</h2>

        <h1>Welcome, {user.name}</h1>
        <p>You're logged in as {user.username}.</p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <a href="/study" className="link-button">
          Study flashcards
        </a>

        <Button type="button" onClick={handleLogout} disabled={submitting}>
          {submitting ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
    </main>
  );
}
