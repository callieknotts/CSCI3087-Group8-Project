import { Link } from 'react-router-dom';
import { paths } from '../routes';
import './Button.css';

// The New / Learn / Due numbers: the cards Repetition mode would start with right now.
// A number above 0 is a link that opens Repetition mode with just those cards; a 0 is plain
// text, because there would be nothing to study.
// Next to them sits a star with the number of starred cards. It links to the starred cards
// page for this deck or subdeck (a 0 is plain text, same as the others).
const NO_COUNTS = { new: 0, learn: 0, due: 0, starred: 0 };

const KINDS = [
  { key: 'new', label: 'New', word: 'new' },
  { key: 'learn', label: 'Learn', word: 'learning' },
  { key: 'due', label: 'Due', word: 'due' },
];

// studyPath(kind) is the Repetition page for this deck or subdeck, limited to that kind;
// starredPath is its starred cards page
function Counts({ counts = NO_COUNTS, studyPath, starredPath, name }) {
  const starred = counts.starred ?? 0;
  const starInside = (
    <>
      <b>{starred}</b>
      <span>★ Star</span>
    </>
  );

  return (
    <div className="counts" title="Click a number to study just those cards in Repetition mode">
      {KINDS.map(({ key, label, word }) => {
        const number = counts[key];
        const inside = (
          <>
            <b>{number}</b>
            <span>{label}</span>
          </>
        );

        if (!number) {
          return (
            <div key={key} className="count">
              {inside}
            </div>
          );
        }

        return (
          <Link
            key={key}
            className="count count--link"
            to={studyPath(key)}
            aria-label={`Study ${number} ${word} ${number === 1 ? 'card' : 'cards'} in ${name}`}
          >
            {inside}
          </Link>
        );
      })}

      {starred ? (
        <Link
          className="count count--star count--link"
          to={starredPath}
          title="See the starred cards"
          aria-label={`See ${starred} starred ${starred === 1 ? 'card' : 'cards'} in ${name}`}
        >
          {starInside}
        </Link>
      ) : (
        <div className="count count--star" title="No starred cards yet">
          {starInside}
        </div>
      )}
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
        <Counts
          counts={deck.counts}
          name={deck.deckname}
          studyPath={(show) => paths.deckRepetition(deck.id, show)}
          starredPath={paths.deckStarred(deck.id)}
        />
        <Link className="btn btn-type2" to={paths.deck(deck.id)}>
          See Deck
        </Link>
      </div>

      {hasSubdecks && open && (
        <ul id={listId} className="library-subs">
          {subdecks.map((sub) => (
            <li key={sub.id} className="library-row library-row--sub">
              <span className="library-name library-name--sub">– {sub.subdeckname}</span>
              <Counts
                counts={sub.counts}
                name={sub.subdeckname}
                studyPath={(show) => paths.subdeckRepetition(deck.id, sub.id, show)}
                starredPath={paths.subdeckStarred(deck.id, sub.id)}
              />
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
