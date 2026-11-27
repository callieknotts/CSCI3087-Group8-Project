import { Link } from 'react-router-dom';
import { paths } from '../routes';

// The panel that opens from the homepage's "Flashcard mode" button. Pick a whole deck
// (every card in it, subdecks included) or just one subdeck, or study the starred cards.
export default function FlashcardPicker({ decks, onClose }) {
  return (
    <section id="flashcard-picker" className="picker" aria-label="Choose what to study">
      <div className="picker-top">
        <p>Pick a whole deck, or just one subdeck in it.</p>
        <Link className="btn btn-type2" to={paths.starredFlashcards}>
          ★ Starred cards
        </Link>
        <button type="button" className="btn btn-type2" onClick={onClose}>
          Close
        </button>
      </div>

      {decks.length === 0 ? (
        <p>You don't have any decks yet.</p>
      ) : (
        <ul className="picker-list">
          {decks.map((deck) => (
            <li key={deck.id}>
              {/* the deck row: its name and a button for the whole deck */}
              <div className="picker-row">
                <span className="picker-name">{deck.deckname}</span>
                <Link
                  className="btn btn-type1"
                  to={paths.deckFlashcards(deck.id)}
                  aria-label={`Flashcard mode for all of ${deck.deckname}`}
                >
                  Whole deck
                </Link>
              </div>

              {/* one row per subdeck, each with its own button */}
              {deck.subdecks.length > 0 && (
                <ul className="picker-subs">
                  {deck.subdecks.map((sub) => (
                    <li key={sub.id} className="picker-row picker-row--sub">
                      <span className="picker-name">– {sub.subdeckname}</span>
                      <Link
                        className="btn btn-type2"
                        to={paths.subdeckFlashcards(deck.id, sub.id)}
                        aria-label={`Flashcard mode for subdeck ${sub.subdeckname} in ${deck.deckname}`}
                      >
                        Subdeck only
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
