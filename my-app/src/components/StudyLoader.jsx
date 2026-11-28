import { Link, useParams } from 'react-router-dom';
import { useLoad } from '../hooks/useLoad';
import { paths } from '../routes';
import { loadFlashcardSet } from '../utils/loadFlashcardSet';
import '../pages/FlashcardPage.css';

// Loads the cards for the page's address (a deck, a subdeck, or every starred card) and shows
// the loading / error / "no cards" screens, so each study mode only draws its own screen.
//   mode      the mode's name, used so two modes never share one loaded result
//   children  a function that gets { title, backTo, backLabel, cards, starred } and returns the screen
export default function StudyLoader({ mode, children }) {
  const { deckId, subdeckId } = useParams();
  const state = useLoad(
    () => loadFlashcardSet(deckId, subdeckId),
    `${mode}/${deckId ?? 'starred'}/${subdeckId ?? ''}`,
  );

  if (state.status === 'loading') {
    return (
      <main className="flash">
        <p className="flash-message">Loading cards…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
      <main className="flash">
        <div className="flash-message" role="alert">
          <p>{state.message}</p>
          <button type="button" className="btn btn-type2" onClick={state.retry}>
            Try again
          </button>{' '}
          <Link className="btn btn-type2" to={paths.home}>
            Back to the library
          </Link>
        </div>
      </main>
    );
  }

  const set = state.data;

  if (set.cards.length === 0) {
    return (
      <main className="flash">
        <Link className="flash-back" to={set.backTo}>
          ← {set.backLabel}
        </Link>
        <h1 className="flash-title">{set.title}</h1>
        <p className="flash-message">
          {deckId
            ? 'There are no cards here yet, so there is nothing to study.'
            : "You haven't starred any cards yet. Star a card while studying to find it here."}
        </p>
      </main>
    );
  }

  return children(set);
}
