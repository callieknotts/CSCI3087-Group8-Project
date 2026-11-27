import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { listDecks, listSubdecks } from '../api/decksApi';
import { sortDecks, sortSubdecks } from '../utils/sortDecks';
import LibraryDeck from '../components/LibraryDeck';
import { paths } from '../routes';
import './HomePage.css';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created at' },
  { value: 'opened_at', label: 'Opened at' },
  { value: 'deckname', label: 'Deck name' },
];

// Loads the user's decks, then the subdecks of each deck.
// The backend answers "this deck has no subdecks" with an error (HTTP 500) instead of an
// empty list, so a 500 here is treated as "no subdecks". Anything else is a real error.
async function loadLibrary() {
  const decks = await listDecks();

  return Promise.all(
    decks.map(async (deck) => {
      try {
        const subdecks = await listSubdecks(deck.id);
        return { ...deck, subdecks: sortSubdecks(subdecks) };
      } catch (err) {
        if (err.status === 500) {
          return { ...deck, subdecks: [] };
        }
        throw err;
      }
    }),
  );
}

// The page shown right after login: the user's library of decks.
export default function HomePage() {
  const { onUnauthorized } = useOutletContext();

  const [library, setLibrary] = useState(null); // null = still loading
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // PLACEHOLDER: "Search your decks" can be typed in, but nothing uses the text yet.
  // The backend has no search for decks and subdecks. TODO: connect it when it exists.
  const [searchText, setSearchText] = useState('');

  const [sortKey, setSortKey] = useState('created_at');
  const [order, setOrder] = useState('asc');
  const [openIds, setOpenIds] = useState(() => new Set());

  // Keep the latest onUnauthorized without making the loading effect depend on it.
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    let ignore = false;

    loadLibrary()
      .then((result) => {
        if (!ignore) setLibrary(result);
      })
      .catch((err) => {
        if (ignore) return;
        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }
        setLoadError(err.message);
      });

    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retryLoad() {
    setLoadError('');
    setLibrary(null);
    setAttempt((n) => n + 1);
  }

  function toggleDeck(deckId) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(deckId)) next.delete(deckId);
      else next.add(deckId);
      return next;
    });
  }

  const sortedDecks = useMemo(
    () => (library ? sortDecks(library, sortKey, order) : []),
    [library, sortKey, order],
  );

  return (
    <main className="library">
      <div className="library-head">
        <h1>Library</h1>

        {/* the only way to reach the cards the user starred (flashcard mode for a deck or
            subdeck lives on that deck's or subdeck's own page) */}
        <Link className="btn btn-type2 library-starred-link" to={paths.starredFlashcards}>
          ★ Starred cards
        </Link>

        <input
          type="search"
          className="library-control library-search"
          placeholder="Search your decks"
          aria-label="Search your decks"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

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

      {loadError && (
        <div className="library-message" role="alert">
          <p>{loadError}</p>
          <button type="button" className="link-button" onClick={retryLoad}>
            Try again
          </button>
        </div>
      )}

      {!loadError && library === null && (
        <p className="library-message">Loading your library…</p>
      )}

      {!loadError && library !== null && library.length === 0 && (
        <p className="library-message">
          You don't have any decks yet. Use the + button at the top to create one.
        </p>
      )}

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
