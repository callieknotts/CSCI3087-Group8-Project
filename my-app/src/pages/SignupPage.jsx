import { useEffect, useState } from 'react';
import TextField from '../components/TextField';
import Button from '../components/Button';
import './LoginPage.css'; // use same css as the Login Page
import '../components/Header.css'; //for the light/dark toggle

export default function SignupPage({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch('/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, username, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        if (Array.isArray(body.detail)) {
          const next = {};
          for (const item of body.detail) {
            const field = item.loc?.[item.loc.length - 1];
            next[field] = item.msg.replace(/^Value error, /, '');
          }
          setFieldErrors(next);
        } else {
          setFormError(
            typeof body.detail === 'string'
              ? body.detail
              : 'Could not create the account. Try again.'
          );
        }
        return;
      }

      setCreated(true);
    } catch {
      setFormError('Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const themeToggleButton = (
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
  );

  if (created) {
    return (
      <>
        <main className="login-page">
          <div className="login-form">
            <h1>Account created</h1>
            <p>You can log in now.</p>
            <Button onClick={onSwitchToLogin}>Go to log in</Button>
          </div>
        </main>
        {themeToggleButton}
      </>
    );
  }

  return (
    <>
      <main className="login-page">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h1>Create account</h1>

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            autoComplete="name"
          />

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            autoComplete="username"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="new-password"
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </Button>

          <p className="login-switch">
            Already have an account?{' '}
            <button type="button" className="link-button" onClick={onSwitchToLogin}>
              Log in
            </button>
          </p>
        </form>
      </main>
      {themeToggleButton}
    </>
  );
}
