import { useState } from 'react';
import TextField from '../components/TextField';
import Button from '../components/Button';
import './LoginPage.css'; //use same css as the Login Page
 
export default function SignupPage({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
 
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
 
  if (created) {
    return (
      <main className="login-page">
        <div className="login-form">
          <h1>Account created</h1>
          <p>You can log in now.</p>
          <Button onClick={onSwitchToLogin}>Go to log in</Button>
        </div>
      </main>
    );
  }
 
  return (
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
  );
}
