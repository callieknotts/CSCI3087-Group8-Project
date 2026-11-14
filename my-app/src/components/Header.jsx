import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../routes';
import './Header.css';

// The website header: home button, search, "+" button and the profile menu.
// It only shows things and sends the user to other pages. Logging out is done by
// the Layout, which passes it in as onLogout.
export default function Header({ onLogout, loggingOut = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // While the profile menu is open, close it on an outside click or the Escape key.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  // PSEUDO PATH: search is not built in the backend yet. Submitting only goes to
  // /search?q=..., a placeholder page. Later that page can call the real search.
  function handleSearch(event) {
    event.preventDefault();
    const text = query.trim();
    if (!text) return;
    navigate(`${paths.search}?q=${encodeURIComponent(text)}`);
  }

  function handleLogoutClick() {
    setMenuOpen(false);
    onLogout();
  }

  return (
    <header className="site-header">
      <div className="site-header__bar">
        <Link
          to={paths.home}
          className="icon-btn icon-btn--filled"
          aria-label="Back to homepage"
          title="Back to homepage"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h5v-6h4v6h5V10" />
          </svg>
        </Link>

        <form className="site-search" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <Link
          to={paths.manage}
          className="icon-btn"
          aria-label="Create deck"
          title="Create deck"
        >
          +
        </Link>

        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Profile menu"
            title="Profile menu"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-controls="profile-menu-list"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </button>

          {menuOpen && (
            <ul id="profile-menu-list" className="profile-menu__list">
              <li>
                <Link
                  to={paths.profile}
                  className="profile-menu__item"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  className="profile-menu__item"
                  onClick={handleLogoutClick}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </header>
  );
}
