import { useCallback, useEffect, useState } from 'react';
import ShuffleControls from '../components/ShuffleControls';
import StarButton from '../components/StarButton';
import StudyFrame from '../components/StudyFrame';
import StudyLoader from '../components/StudyLoader';
import { useCardOrder } from '../hooks/useCardOrder';
import { useStarred } from '../hooks/useStarred';
import { sideText } from '../utils/cardText';

// Front & back mode. Routes:
//   /decks/:deckId/front-and-back   /decks/:deckId/subdecks/:sid/front-and-back   /flashcards/starred/front-and-back
// Each card shows its front AND its back at the same time (nothing to flip), one card at a time.
export default function FrontBackPage() {
  return <StudyLoader mode="front-back">{(set) => <FrontBack set={set} />}</StudyLoader>;
}

function FrontBack({ set }) {
  const { title, backTo, backLabel, cards } = set;
  const { starred, toggle, error } = useStarred(set.starred);
  const { order, shuffled, round, shuffleNow, reset } = useCardOrder(cards);

  return (
    <StudyFrame
      backTo={backTo}
      backLabel={backLabel}
      title={title}
      modeName="Front & back"
      tools={
        cards.length > 1 ? (
          <ShuffleControls shuffled={shuffled} onShuffle={shuffleNow} onReset={reset} />
        ) : null
      }
      error={error}
    >
      {/* a new round (after a shuffle or reset) starts again from the first card */}
      <Cards key={round} cards={order} starred={starred} onToggleStar={toggle} />
    </StudyFrame>
  );
}

function Cards({ cards, starred, onToggleStar }) {
  const [index, setIndex] = useState(0);
  const last = cards.length - 1;
  const card = cards[index];

  const go = useCallback(
    (step) => setIndex((i) => Math.min(last, Math.max(0, i + step))),
    [last],
  );

  // Keyboard: right arrow is next, left arrow is previous.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [go]);

  const release = (event) => {
    if (event.detail > 0) event.currentTarget.blur();
  };

  return (
    <>
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through the cards"
        aria-valuemin={1}
        aria-valuemax={cards.length}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
      </div>

      <div className="flash-stage">
        <div className="fb-card">
          <section className="fb-side" aria-label="Front">
            <span className="flash-side">Front</span>
            <p className="flash-text">{sideText(card.content?.front)}</p>
          </section>
          <section className="fb-side fb-side--back" aria-label="Back">
            <span className="flash-side">Back</span>
            <p className="flash-text">{sideText(card.content?.back)}</p>
          </section>
        </div>
        <StarButton starred={starred.has(card.id)} onToggle={() => onToggleStar(card)} />
      </div>

      <div className="flash-nav">
        <button
          type="button"
          className="flash-arrow"
          aria-label="Previous card"
          disabled={index === 0}
          onClick={(event) => {
            release(event);
            go(-1);
          }}
        >
          ←
        </button>
        <span className="flash-count">
          {index + 1} / {cards.length}
        </span>
        <button
          type="button"
          className="flash-arrow"
          aria-label="Next card"
          disabled={index === last}
          onClick={(event) => {
            release(event);
            go(1);
          }}
        >
          →
        </button>
      </div>

      <p className="flash-hint">← and → move between cards.</p>
    </>
  );
}
