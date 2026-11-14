import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import { paths } from '../routes';
import './Layout.css';

const LOGOUT_URL = '/api/users/logout';

// The frame around every page after login: the header on top, the current page below.
// It also owns the logout request (moved here from the old Welcome page, same behavior).
export default function Layout({ user, onLogout }) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');
    setLoggingOut(true);

    try {
      const res = await fetch(LOGOUT_URL, {
        method: 'DELETE',
        credentials: 'include',
      });

      // 401: the session is already gone (treat it as logged out too)
      if (!res.ok && res.status !== 401) {
        setLogoutError('Could not log out. Try again.');
        return;
      }

      navigate(paths.home); // so the next login starts on the homepage
      onLogout();
    } catch {
      setLogoutError('Could not reach the server. Try again.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <Header onLogout={handleLogout} loggingOut={loggingOut} />

      {logoutError && (
        <p className="layout-error" role="alert">
          {logoutError}
        </p>
      )}

      {/* Pages read the user and onUnauthorized with useOutletContext(). */}
      <Outlet context={{ user, onUnauthorized: onLogout }} />
    </>
  );
}
