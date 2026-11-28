import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../routes';
import './Header.css';

// The website header: home button, search, deck management button and profile menu.
// It only shows things and sends the user to other pages. Logging out is done by
// the Layout, which passes it in as onLogout.
export default function Header({ onLogout, loggingOut = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const menuRef = useRef(null);

  // Sync theme attribute to <html> and save preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Show the scroll-to-top button once the user scrolls down
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 300);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
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
            aria-label="Add or edit decks"
            title="Add or edit decks"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="4" width="12" height="15" rx="2" />
              <path d="M9 8h4M9 12h4M9 16h2" />
              <path d="M9 2h10a2 2 0 0 1 2 2v14" />
            </svg>
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

      {/* Bottom-left: Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          className="icon-btn floating-btn floating-btn--bottom-left"
          aria-label="Scroll to top"
          title="Scroll to top"
          onClick={scrollToTop}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Bottom-right: Light/Dark theme toggle */}
      <button
        type="button"
        className="icon-btn floating-btn floating-btn--bottom-right"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
      >
        {theme === 'dark' ? (
          /* Sun icon when in dark mode */
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          /* Moon icon when in light mode */
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </>
  );
}
