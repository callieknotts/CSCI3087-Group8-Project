import { useEffect, useState } from 'react';
import TextField from '../components/TextField';
import Button from '../components/Button';
import './LoginPage.css';
import '../components/Header.css'; //for the light/dark toggle

export default function LoginPage({ onLogin, onSwitchToSignup }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/users/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFormError(
          typeof body.detail === 'string'
            ? body.detail
            : 'Check your login and password and try again.'
        );
        return;
      }

      const meRes = await fetch('/api/users/me');
      if (!meRes.ok) {
        setFormError('Logged in, but could not load your account. Try again.');
        return;
      }

      onLogin(await meRes.json()); // tells App the login worked, so it shows the home page
    } catch {
      setFormError('Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <main className="login-page">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h1>Log in</h1>

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <TextField
            label="Email or username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoComplete="username"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>

          {onSwitchToSignup && (
            <p className="login-switch">
              New here?{' '}
              <button type="button" className="link-button" onClick={onSwitchToSignup}>
                Create an account
              </button>
            </p>
          )}
        </form>
      </main>

      {/* Bottom-right: Light/Dark theme toggle */}
      <button
        type="button"
        className="icon-btn floating-btn floating-btn--bottom-right"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </>
  );
}
