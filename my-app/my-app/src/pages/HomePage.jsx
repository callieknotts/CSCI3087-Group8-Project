// bring in React's tools, the router's access to the Layout's data, the backend calls,
// the sorting helpers, the deck row component, and this page's styles
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { listDecks, listSubdecks } from '../api/decksApi';
import { sortDecks, sortSubdecks } from '../utils/sortDecks';
import LibraryDeck from '../components/LibraryDeck';
import './HomePage.css';

// the choices shown in the "Sort by" dropdown (value = what the code uses, label = what the user sees)
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created at' },
  { value: 'opened_at', label: 'Opened at' },
  { value: 'deckname', label: 'Deck name' },
];

// Loads the user's decks, then the subdecks of each deck.
// The backend answers "this deck has no subdecks" with an error (HTTP 500) instead of an
// empty list, so a 500 here is treated as "no subdecks". Anything else is a real error.
async function loadLibrary() {
  // get every deck first
  const decks = await listDecks();

  // then fetch the subdecks of all decks at the same time and attach them to their deck
  return Promise.all(
    decks.map(async (deck) => {
      try {
        const subdecks = await listSubdecks(deck.id);
        return { ...deck, subdecks: sortSubdecks(subdecks) };
      } catch (err) {
        // a 500 means "no subdecks", so give the deck an empty list
        if (err.status === 500) {
          return { ...deck, subdecks: [] };
        }
        // any other error is real, so pass it up to the page
        throw err;
      }
    }),
  );
}

// The page shown right after login: the user's library of decks.
export default function HomePage() {
  // the function from the Layout that sends the user back to login
  const { onUnauthorized } = useOutletContext();

  // what the page is loading or showing: the decks, any error message,
  // and a counter that makes the load run again when "Try again" is clicked
  const [library, setLibrary] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // PLACEHOLDER: "Search your decks" can be typed in, but nothing uses the text yet.
  // The backend has no search for decks and subdecks. TODO: connect it when it exists.
  const [searchText, setSearchText] = useState('');

  // the user's choices: how to sort, which direction, and which decks have their subdecks open
  const [sortKey, setSortKey] = useState('created_at');
  const [order, setOrder] = useState('asc');
  const [openIds, setOpenIds] = useState(() => new Set());

  // Keep the latest onUnauthorized without making the loading effect depend on it.
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    // lets us ignore the answer if the page closes or reloads before it arrives
    let ignore = false;

    // loads the library from the backend once the page opens
    loadLibrary()
      .then((result) => {
        if (!ignore) setLibrary(result);
      })
      .catch((err) => {
        if (ignore) return;
        // 401 = the session ended, so send the user back to login
        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }
        // any other error: show its message on the page
        setLoadError(err.message);
      });

    // cleanup: runs when the page closes or the load restarts
    return () => {
      ignore = true;
    };
  }, [attempt]);

  // "Try again": clear the error, go back to the loading state, and run the load again
  function retryLoad() {
    setLoadError('');
    setLibrary(null);
    setAttempt((n) => n + 1);
  }

  // opens or closes one deck's subdeck list
  function toggleDeck(deckId) {
    // copy the set of open decks, then add or remove this deck's id
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(deckId)) next.delete(deckId);
      else next.add(deckId);
      return next;
    });
  }

  // creates the sorted list of decks to display: once the library
  // has loaded, it runs sortDecks with the chosen sort option and order
  const sortedDecks = useMemo(
    () => (library ? sortDecks(library, sortKey, order) : []),
    [library, sortKey, order],
  );

  // the page's layout
  return (
    <main className="library">
      {/* top row: the heading, the search box, and the two dropdowns */}
      <div className="library-head">
        <h1>Library</h1>

        {/* search box (placeholder for now: it keeps the typed text but filters nothing) */}
        <input
          type="search"
          className="library-control library-search"
          placeholder="Search your decks"
          aria-label="Search your decks"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        {/* dropdown that picks what the decks are sorted by */}
        <select
          className="library-control"
          aria-label="Sort by"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* dropdown that picks ascending or descending order */}
        <select
          className="library-control"
          aria-label="Order"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
      </div>

      {/* error message with a "Try again" button, shown only if loading failed */}
      {loadError && (
        <div className="library-message" role="alert">
          <p>{loadError}</p>
          <button type="button" className="link-button" onClick={retryLoad}>
            Try again
          </button>
        </div>
      )}

      {/* shown while the decks are still loading */}
      {!loadError && library === null && (
        <p className="library-message">Loading your library…</p>
      )}

      {/* shown when loading worked but the user has no decks */}
      {!loadError && library !== null && library.length === 0 && (
        <p className="library-message">
          You don't have any decks yet. Use the + button at the top to create one.
        </p>
      )}

      {/* the list of decks: one row per deck, in the chosen sort order */}
      {!loadError && library !== null && library.length > 0 && (
        <ul className="library-list">
          {sortedDecks.map((deck) => (
            <LibraryDeck
              key={deck.id}
              deck={deck}
              subdecks={deck.subdecks}
              open={openIds.has(deck.id)}
              onToggle={() => toggleDeck(deck.id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
