import { Link, useParams } from 'react-router-dom';
import { ApiError, getDeck, getSubdeck, listCards, listDecks, listStarredCardIds } from '../api/decksApi';
import { useLoad } from '../hooks/useLoad';
import { useStarred } from '../hooks/useStarred';
import ModeMenu from '../components/ModeMenu';
import { paths } from '../routes';
import { sideText } from '../utils/cardText';
import './DetailPage.css'; // the page frame, back link and card boxes are shared with the deck page
import './StarredPage.css';

// Loads the cards of the page's scope, grouped for display, with every card (starred or not).
//   /starred                                    every deck, one group per deck
//   /decks/:deckId/starred                      one deck (and its subdecks), one group
//   /decks/:deckId/subdecks/:sid/starred        one subdeck, one group
async function loadScope(deckId, subdeckId) {
  // one subdeck. The backend answers a missing subdeck with a 500, so say "not found" instead.
  if (subdeckId) {
    const [deck, subdeck, cards] = await Promise.all([
      getDeck(deckId),
      getSubdeck(deckId, subdeckId).catch((err) => {
        if (err.status === 500) throw new ApiError(404, 'That subdeck could not be found.');
        throw err;
      }),
      listCards(deckId, subdeckId),
    ]);
    if (!deck) throw new ApiError(404, 'That deck could not be found.');
    return {
      scopeName: subdeck.subdeckname,
      backTo: paths.subdeck(deckId, subdeckId),
      backLabel: subdeck.subdeckname,
      groups: [{ key: subdeckId, cards }],
    };
  }

  // one deck: the backend returns the cards of every subdeck too, so one request covers it
  if (deckId) {
    const [deck, cards] = await Promise.all([getDeck(deckId), listCards(deckId)]);
    if (!deck) throw new ApiError(404, 'That deck could not be found.');
    return {
      scopeName: deck.deckname,
      backTo: paths.deck(deckId),
      backLabel: deck.deckname,
      groups: [{ key: deckId, cards }],
    };
  }

  // everything: look through every deck
  const decks = await listDecks();
  const lists = await Promise.all(decks.map((deck) => listCards(deck.id)));
  return {
    scopeName: null,
    backTo: paths.home,
    backLabel: 'Library',
    studyTo: paths.starredFlashcards, // flashcard mode only knows "all starred cards"
    groups: decks.map((deck, i) => ({
      key: deck.id,
      title: deck.deckname,
      titleTo: paths.deck(deck.id),
      cards: lists[i],
    })),
  };
}

// Loads the page's cards and the user's stars together, and keeps only the starred cards.
async function loadStarredPage(deckId, subdeckId) {
  const [page, starred] = await Promise.all([loadScope(deckId, subdeckId), listStarredCardIds()]);

  const groups = page.groups
    .map((group) => ({ ...group, cards: group.cards.filter((card) => starred.has(card.id)) }))
    // the all-decks page only lists decks that have starred cards
    .filter((group) => group.title === undefined || group.cards.length > 0);

  return { ...page, groups, starred };
}

// The page: loads the starred cards, then shows them (or a message if it cannot).
export default function StarredPage() {
  const { deckId, subdeckId } = useParams();

  const state = useLoad(
    () => loadStarredPage(deckId, subdeckId),
    `${deckId ?? 'all'}/${subdeckId ?? ''}`,
  );

  if (state.status === 'loading') {
    return (
      <main className="detail">
        <p className="detail-message">Loading starred cards…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="detail">
        <div className="detail-message" role="alert">
          <p>{state.message}</p>
          <button type="button" className="link-button" onClick={state.retry}>
            Try again
          </button>
          <p>
            <Link to={paths.home}>Back to the library</Link>
          </p>
        </div>
      </main>
    );
  }

  return <StarredCards data={state.data} />;
}

// The list itself. Un-starring a card keeps it on the page (with an empty star) so a slip of
// the mouse can be undone; it is gone the next time the page is opened.
function StarredCards({ data }) {
  const { scopeName, backTo, backLabel, studyTo, groups } = data;
  const { starred, toggle, error } = useStarred(data.starred);

  const shown = groups.reduce((total, group) => total + group.cards.length, 0);
  const stillStarred = groups.reduce(
    (total, group) => total + group.cards.filter((card) => starred.has(card.id)).length,
    0,
  );

  return (
    <main className="detail">
      <Link className="detail-back" to={backTo}>
        ← {backLabel}
      </Link>

      <div className="detail-head">
        <h1>★ Starred cards</h1>
        {shown > 0 && (
          <ModeMenu
            label="Review mode"
            modes={[
              { label: 'Classic', to: studyTo || paths.starredFlashcards },
              { label: 'Repetition', to="/flashcards/starred/repetition" },
            ]}
          />
        )}
      </div>
      <p className="detail-meta">
        {scopeName && <>in {scopeName} · </>}
        {stillStarred} starred {stillStarred === 1 ? 'card' : 'cards'}
      </p>

      {/* shown only when the backend refused to save a star (the star went back) */}
      {error && (
        <p className="detail-message" role="alert">
          {error}
        </p>
      )}

      {shown === 0 && (
        <p className="detail-message">
          {scopeName
            ? `You haven't starred any cards in ${scopeName} yet.`
            : "You haven't starred any cards yet."}{' '}
          Star a card while studying in Classic mode to find it here.
        </p>
      )}

      {groups.map((group) =>
        group.cards.length === 0 ? null : (
          <section
            key={group.key}
            className="detail-section"
            aria-label={group.title ?? 'Starred cards'}
          >
            {group.title && (
              <div className="detail-section-head">
                <h2>
                  <Link to={group.titleTo}>{group.title}</Link>
                </h2>
              </div>
            )}
            <ul className="card-list">
              {group.cards.map((card) => {
                const isStarred = starred.has(card.id);
                return (
                  <li key={card.id} className="card-row starred-row">
                    <div className="card-side">
                      <span className="card-side-label">Front</span>
                      <p>{sideText(card.content?.front)}</p>
                    </div>
                    <div className="card-side">
                      <span className="card-side-label">Back</span>
                      <p>{sideText(card.content?.back)}</p>
                    </div>
                    <button
                      type="button"
                      className={`starred-toggle${isStarred ? ' starred-toggle--on' : ''}`}
                      aria-pressed={isStarred}
                      aria-label={isStarred ? 'Remove star from this card' : 'Star this card'}
                      title={isStarred ? 'Remove star' : 'Star this card'}
                      onClick={() => toggle(card)}
                    >
                      {isStarred ? '★' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}
    </main>
  );
}
