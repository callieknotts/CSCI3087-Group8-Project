import { useState } from 'react';
import Button from '../components/Button';
import './LoginPage.css';

export default function HomePage({ user, onLogout }) {
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    setFormError('');
    setSubmitting(true);

    try {
      // ASSUMED route: ask your teammate for the real logout path.
      const res = await fetch('/api/users/auth/logout', { method: 'POST' });

      if (!res.ok) {
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
    <main className="login-page">
      <div className="login-form">
        <h1>Welcome, {user.name}</h1>
        <p>You're logged in as {user.username}.</p>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <Button type="button" onClick={handleLogout} disabled={submitting}>
          {submitting ? 'Logging out…' : 'Log out'}
        </Button>
      </div>
    </main>
  );
}