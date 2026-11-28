import { Link, useParams } from 'react-router-dom';
import { ApiError, getDeck, getSubdeck, listCards } from '../api/decksApi';
import CardList from '../components/CardList';
import ModeMenu from '../components/ModeMenu';
import { useLoad } from '../hooks/useLoad';
import { paths } from '../routes';
import { studyModes } from '../utils/studyModes';
import './DetailPage.css';

// Loads one subdeck, the deck it belongs to (for the back link) and the subdeck's cards.
// The backend answers a missing subdeck with a 500, so that is reported as "not found".
async function loadSubdeckPage(deckId, subdeckId) {
  const [deck, subdeck, cards] = await Promise.all([
    getDeck(deckId),
    getSubdeck(deckId, subdeckId).catch((err) => {
      if (err.status === 500) throw new ApiError(404, 'That subdeck could not be found.');
      throw err;
    }),
    listCards(deckId, subdeckId),
  ]);
  if (!deck) throw new ApiError(404, 'That deck could not be found.');
  return { deck, subdeck, cards };
}

// A subdeck's page: its cards, with a flashcard button for just this subdeck at the top.
export default function SubdeckPage() {
  const { deckId, subdeckId } = useParams();
  const state = useLoad(() => loadSubdeckPage(deckId, subdeckId), `${deckId}/${subdeckId}`);

  if (state.status === 'loading') {
    return (
      <main className="detail">
        <p className="detail-message">Loading subdeck…</p>
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

  const { deck, subdeck, cards } = state.data;

  return (
    <main className="detail">
      <Link className="detail-back" to={paths.deck(deck.id)}>
        ← {deck.deckname}
      </Link>

      <div className="detail-head">
        <h1>{subdeck.subdeckname}</h1>
        <ModeMenu modes={studyModes(deck.id, subdeck.id)} />
      </div>
      <p className="detail-meta">
        {cards.length} {cards.length === 1 ? 'card' : 'cards'}
      </p>

      <CardList cards={cards} emptyText="This subdeck doesn't have any cards yet." />
    </main>
  );
}
