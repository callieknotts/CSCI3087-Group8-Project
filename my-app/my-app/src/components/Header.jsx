// bring in React's tools, the router's link and page-switching tools,
// the shared page addresses, and this header's styles
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '../routes';
import './Header.css';

// The website header: home button, search, "+" button and the profile menu.
// It only shows things and sends the user to other pages. Logging out is done by
// the Layout, which passes it in as onLogout.
export default function Header({ onLogout, loggingOut = false }) {
  // navigate = jump to another page from code; query = the text typed in the search box;
  // menuOpen = whether the profile menu is showing; menuRef = a handle on the menu's box
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // While the profile menu is open, close it on an outside click or the Escape key.
  useEffect(() => {
    // nothing to listen for while the menu is closed
    if (!menuOpen) return undefined;

    // close the menu if the click was outside of it
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    // close the menu if the Escape key was pressed
    function handleKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    // start listening for clicks and key presses anywhere on the page
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    // cleanup: stop listening when the menu closes or the header goes away
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  // PSEUDO PATH: search is not built in the backend yet. Submitting only goes to
  // /search?q=..., a placeholder page. Later that page can call the real search.
  function handleSearch(event) {
    // stop the form from reloading the page
    event.preventDefault();
    // ignore empty searches (or ones with only spaces)
    const text = query.trim();
    if (!text) return;
    // go to the search page, with the typed text safely added to the address
    navigate(`${paths.search}?q=${encodeURIComponent(text)}`);
  }

  // close the menu, then run the logout that the Layout passed in
  function handleLogoutClick() {
    setMenuOpen(false);
    onLogout();
  }

  return (
    <header className="site-header">
      <div className="site-header__bar">
        {/* the round house button: links back to the homepage */}
        <Link
          to={paths.home}
          className="icon-btn icon-btn--filled"
          aria-label="Back to homepage"
          title="Back to homepage"
        >
          {/* the house icon drawn with two lines */}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h5v-6h4v6h5V10" />
          </svg>
        </Link>

        {/* the search box: pressing Enter runs handleSearch */}
        <form className="site-search" role="search" onSubmit={handleSearch}>
          <input
            type="search"
            placeholder="Search"
            aria-label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        {/* the "+" button: links to the page for creating decks, subdecks and cards */}
        <Link
          to={paths.manage}
          className="icon-btn"
          aria-label="Create deck"
          title="Create deck"
        >
          +
        </Link>

        {/* the profile button and its drop-down menu */}
        <div className="profile-menu" ref={menuRef}>
          {/* the round profile button: clicking it opens or closes the menu */}
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
            {/* the person icon drawn with a circle (head) and a curve (shoulders) */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </button>

          {/* the menu list: only shown while the menu is open */}
          {menuOpen && (
            <ul id="profile-menu-list" className="profile-menu__list">
              {/* "Profile" links to the profile page and closes the menu */}
              <li>
                <Link
                  to={paths.profile}
                  className="profile-menu__item"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              </li>
              {/* "Logout" button: logs the user out (disabled and relabeled while it works) */}
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
