import { Link, useParams } from 'react-router-dom';
import { ApiError, getDeck, listCards, listSubdecks } from '../api/decksApi';
import CardList from '../components/CardList';
import { useLoad } from '../hooks/useLoad';
import { paths } from '../routes';
import { sortSubdecks } from '../utils/sortDecks';
import './DetailPage.css';

// Loads one deck, its subdecks and all of its cards. The backend answers "no subdecks" with
// a 500 and "no such deck" with an empty (null) deck, so both are handled here.
async function loadDeckPage(deckId) {
  const [deck, subdecks, cards] = await Promise.all([
    getDeck(deckId),
    listSubdecks(deckId).catch((err) => {
      if (err.status === 500) return [];
      throw err;
    }),
    listCards(deckId),
  ]);
  if (!deck) throw new ApiError(404, 'That deck could not be found.');
  return { deck, subdecks: sortSubdecks(subdecks), cards };
}

// A deck's page: every subdeck with its cards, plus any cards that are in no subdeck.
export default function DeckPage() {
  const { deckId } = useParams();
  const state = useLoad(() => loadDeckPage(deckId), deckId);

  if (state.status === 'loading') {
    return (
      <main className="detail">
        <p className="detail-message">Loading deck…</p>
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

  const { deck, subdecks, cards } = state.data;

  // sort the cards into their subdecks; the rest belong to the deck itself
  const cardsBySubdeck = new Map(subdecks.map((sub) => [sub.id, []]));
  const looseCards = [];
  for (const card of cards) {
    if (card.subdeck_id && cardsBySubdeck.has(card.subdeck_id)) {
      cardsBySubdeck.get(card.subdeck_id).push(card);
    } else {
      looseCards.push(card);
    }
  }

  return (
    <main className="detail">
      <Link className="detail-back" to={paths.home}>
        ← Library
      </Link>

      {/* deck name, with the flashcard button for the WHOLE deck at the top */}
      <div className="detail-head">
        <h1>{deck.deckname}</h1>
        <Link className="btn btn-type1" to={paths.deckFlashcards(deck.id)}>
          Flashcard mode
        </Link>
      </div>
      {deck.description && <p className="detail-description">{deck.description}</p>}
      <p className="detail-meta">
        {cards.length} {cards.length === 1 ? 'card' : 'cards'} · {subdecks.length}{' '}
        {subdecks.length === 1 ? 'subdeck' : 'subdecks'}
      </p>

      {/* one section per subdeck, each with its own flashcard button and its cards */}
      {subdecks.map((sub) => (
        <section key={sub.id} className="detail-section" aria-label={sub.subdeckname}>
          <div className="detail-section-head">
            <h2>
              <Link to={paths.subdeck(deck.id, sub.id)}>{sub.subdeckname}</Link>
            </h2>
            <Link
              className="btn btn-type2"
              to={paths.subdeckFlashcards(deck.id, sub.id)}
              aria-label={`Flashcard mode for subdeck ${sub.subdeckname}`}
            >
              Flashcard mode
            </Link>
          </div>
          <CardList
            cards={cardsBySubdeck.get(sub.id)}
            emptyText="No cards in this subdeck yet."
          />
        </section>
      ))}

      {/* cards that are in the deck but not in any subdeck */}
      {looseCards.length > 0 && (
        <section className="detail-section" aria-label="Cards without a subdeck">
          <div className="detail-section-head">
            <h2>{subdecks.length > 0 ? 'Cards without a subdeck' : 'Cards'}</h2>
          </div>
          <CardList cards={looseCards} />
        </section>
      )}

      {cards.length === 0 && (
        <p className="detail-message">This deck doesn't have any cards yet.</p>
      )}
    </main>
  );
}
