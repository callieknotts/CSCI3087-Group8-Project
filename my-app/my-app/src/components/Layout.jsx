// wraps every page after login with the header and runs
// the logout request

// bring in React's state tool, the router's page-slot and page-switching tools,
// the header, the shared page addresses, and this layout's styles
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import { paths } from '../routes';
import './Layout.css';

// the backend address that logs the user out
const LOGOUT_URL = '/api/users/logout';

// The frame around every page after login: the header on top, the current page below.
// It also owns the logout request (moved here from the old Welcome page, same behavior).
export default function Layout({ user, onLogout }) {
  // navigate = jump to another page from code; loggingOut = true while the request runs;
  // logoutError = the message shown if logging out fails
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    // clear any old error and mark that a logout is in progress
    setLogoutError('');
    setLoggingOut(true);

    try {
      // ask the backend to end the session (credentials sends the login cookie along)
      const res = await fetch(LOGOUT_URL, {
        method: 'DELETE',
        credentials: 'include',
      });

      // 401: the session is already gone (treat it as logged out too)
      if (!res.ok && res.status !== 401) {
        // any other failure: show a message and stay logged in
        setLogoutError('Could not log out. Try again.');
        return;
      }

      // success: go to the homepage address, then tell the app the user is logged out
      navigate(paths.home); // so the next login starts on the homepage
      onLogout();
    } catch {
      // the request never reached the server
      setLogoutError('Could not reach the server. Try again.');
    } finally {
      // whatever happened, the logout attempt is finished
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* the header on top; it gets the logout function and whether a logout is running */}
      <Header onLogout={handleLogout} loggingOut={loggingOut} />

      {/* the logout error message, shown only if there is one */}
      {logoutError && (
        <p className="layout-error" role="alert">
          {logoutError}
        </p>
      )}

      {/* Pages read the user and onUnauthorized with useOutletContext(). */}
      {/* the slot where the current page appears, with the user and logout function shared to it */}
      <Outlet context={{ user, onUnauthorized: onLogout }} />
    </>
  );
}
