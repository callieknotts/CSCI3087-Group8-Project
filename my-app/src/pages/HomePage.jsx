import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  listDecks,
  listSubdecks,
  listCards,
  listReviewStates,
  listStarredCardIds,
} from '../api/decksApi';
import { sortDecks, sortSubdecks } from '../utils/sortDecks';
import { countCards } from '../utils/reviewSchedule';
import { countStarred } from '../utils/starredCards';
import LibraryDeck from '../components/LibraryDeck';
import SortMenu from '../components/SortMenu';
import { paths } from '../routes';
import './HomePage.css';

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Created at' },
  { value: 'opened_at', label: 'Opened at' },
  { value: 'deckname', label: 'Deck name' },
];

// Loads the user's decks, then the subdecks of each deck, plus the New / Learn / Due counts
// (what Repetition mode would start with) and the number of starred cards for every deck
// and subdeck.
// The backend answers "this deck has no subdecks" with an error (HTTP 500) instead of an
// empty list, so a 500 here is treated as "no subdecks". Anything else is a real error.
async function loadLibrary() {
  const [decks, review, starred] = await Promise.all([
    listDecks(),
    listReviewStates(),
    listStarredCardIds(),
  ]);
  const states = new Map(review.states.map((s) => [s.card_id, s]));

  return Promise.all(
    decks.map(async (deck) => {
      let subdecks = [];
      try {
        subdecks = await listSubdecks(deck.id);
      } catch (err) {
        if (err.status !== 500) throw err;
      }

      // one request per deck: it returns the cards of every subdeck too, so each subdeck's
      // numbers come from the cards that belong to it
      const cards = await listCards(deck.id);
      const subsWithCounts = subdecks.map((sub) => {
        const subCards = cards.filter((card) => card.subdeck_id === sub.id);
        return {
          ...sub,
          counts: { ...countCards(subCards, states), starred: countStarred(subCards, starred) },
        };
      });

      return {
        ...deck,
        counts: { ...countCards(cards, states), starred: countStarred(cards, starred) },
        subdecks: sortSubdecks(subsWithCounts),
      };
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

        {/* every card the user starred, from all decks. The star next to each deck's New /
            Learn / Due numbers opens the same page for just that deck or subdeck. */}
        <Link className="btn btn-type2 library-starred-link" to={paths.starred}>
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

        <SortMenu options={SORT_OPTIONS} value={sortKey} onChange={setSortKey} />

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
