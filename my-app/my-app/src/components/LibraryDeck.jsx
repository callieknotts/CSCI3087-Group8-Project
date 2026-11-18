//one deck row in the library, with its arrow, counts, see Deck
//button and subdecks

// bring in the router's link, the made-up counts, the shared page addresses,
// and the shared button styles
import { Link } from 'react-router-dom';
import { pseudoCounts } from '../pseudo/pseudoCounts';
import { paths } from '../routes';
import './Button.css';

// New / Due / Review numbers. PSEUDO values for now (see pseudo/pseudoCounts.js).
function Counts({ counts }) {
  return (
    // the group of three counts; hovering shows a note that the numbers are placeholders
    <div className="counts" title="Placeholder numbers - not connected to the backend yet">
      {/* each count is a number with its label under it */}
      <div className="count">
        <b>{counts.new}</b>
        <span>New</span>
      </div>
      <div className="count">
        <b>{counts.due}</b>
        <span>Due</span>
      </div>
      <div className="count">
        <b>{counts.review}</b>
        <span>Review</span>
      </div>
    </div>
  );
}

// One deck row. If the deck has subdecks it gets an arrow that shows / hides them.
export default function LibraryDeck({ deck, subdecks, open, onToggle }) {
  // does this deck have any subdecks, and what id does its subdeck list get
  const hasSubdecks = subdecks.length > 0;
  const listId = `subdecks-${deck.id}`;

  return (
    <li className="library-group">
      {/* the deck's own row: arrow, name, counts and "See Deck" button */}
      <div className="library-row library-row--deck">
        {/* the arrow button if there are subdecks; otherwise an empty space so names line up */}
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

        {/* the deck's name, its counts, and a link to the deck's page */}
        <h2 className="library-name">{deck.deckname}</h2>
        <Counts counts={pseudoCounts(deck.id)} />
        <Link className="btn btn-type2" to={paths.deck(deck.id)}>
          See Deck
        </Link>
      </div>

      {/* the subdeck rows: only shown if the deck has subdecks and the arrow is open */}
      {hasSubdecks && open && (
        <ul id={listId} className="library-subs">
          {subdecks.map((sub) => (
            // each subdeck row: its name, its own counts, and a link to the subdeck's page
            <li key={sub.id} className="library-row library-row--sub">
              <span className="library-name library-name--sub">– {sub.subdeckname}</span>
              <Counts counts={pseudoCounts(sub.id)} />
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
