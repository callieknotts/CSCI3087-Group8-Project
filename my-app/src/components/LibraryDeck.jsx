import { Link } from 'react-router-dom';
import { paths } from '../routes';
import './Button.css';

// The New / Learn / Due numbers: the cards Repetition mode would start with right now.
const NO_COUNTS = { new: 0, learn: 0, due: 0 };

function Counts({ counts = NO_COUNTS }) {
  return (
    <div className="counts" title="Cards you would study now in Repetition mode">
      <div className="count">
        <b>{counts.new}</b>
        <span>New</span>
      </div>
      <div className="count">
        <b>{counts.learn}</b>
        <span>Learn</span>
      </div>
      <div className="count">
        <b>{counts.due}</b>
        <span>Due</span>
      </div>
    </div>
  );
}

// One deck row. If the deck has subdecks it gets an arrow that shows / hides them.
export default function LibraryDeck({ deck, subdecks, open, onToggle }) {
  const hasSubdecks = subdecks.length > 0;
  const listId = `subdecks-${deck.id}`;

  return (
    <li className="library-group">
      <div className="library-row library-row--deck">
        {hasSubdecks ? (
          <button
            type="button"
            className="expand-btn"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={`${open ? 'Hide' : 'Show'} subdecks of ${deck.deckname}`}
            onClick={onToggle}
          >
            {open ? '↑' : '↓'}
          </button>
        ) : (
          <span className="expand-spacer" aria-hidden="true" />
        )}

        <h2 className="library-name">{deck.deckname}</h2>
        <Counts counts={deck.counts} />
        <Link className="btn btn-type2" to={paths.deck(deck.id)}>
          See Deck
        </Link>
      </div>

      {hasSubdecks && open && (
        <ul id={listId} className="library-subs">
          {subdecks.map((sub) => (
            <li key={sub.id} className="library-row library-row--sub">
              <span className="library-name library-name--sub">– {sub.subdeckname}</span>
              <Counts counts={sub.counts} />
              <Link className="btn btn-type2" to={paths.subdeck(deck.id, sub.id)}>
                See Subdeck
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
