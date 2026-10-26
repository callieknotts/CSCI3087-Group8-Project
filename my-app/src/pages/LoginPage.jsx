import { useState } from 'react';
import TextField from '../components/TextField';
import Button from '../components/Button';
import './LoginPage.css';

export default function LoginPage({ onSwitchToSignup }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

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
      setUser(await meRes.json());
    } catch {
      setFormError('Could not reach the server. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (user) {
    return (
      <main className="login-page">
        <div className="login-form">
          <h1>Welcome, {user.name}</h1>
          <p>You're logged in as {user.username}.</p>
        </div>
      </main>
    );
  }

  return (
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
  );
}