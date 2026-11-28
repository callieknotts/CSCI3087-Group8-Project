import { useCallback, useEffect, useMemo, useState } from 'react';
import ShuffleControls from '../components/ShuffleControls';
import StarButton from '../components/StarButton';
import StudyFrame from '../components/StudyFrame';
import StudyLoader from '../components/StudyLoader';
import { useCardOrder } from '../hooks/useCardOrder';
import { useStarred } from '../hooks/useStarred';
import { sideText } from '../utils/cardText';
import { buildSides, spreadPairs } from '../utils/frontBack';

// Front & back mode. Routes:
//   /decks/:deckId/front-and-back   /decks/:deckId/subdecks/:sid/front-and-back   /flashcards/starred/front-and-back
// Every card is asked twice: once from its front (you see the front, flip to check the back) and
// once from its back (you see the back, flip to check the front). 10 cards = 20 questions.
export default function FrontBackPage() {
  return <StudyLoader mode="front-back">{(set) => <FrontBack set={set} />}</StudyLoader>;
}

function FrontBack({ set }) {
  const { title, backTo, backLabel, cards } = set;
  const { starred, toggle, error } = useStarred(set.starred);
  const sides = useMemo(() => buildSides(cards), [cards]);
  const { order, shuffled, round, shuffleNow, reset } = useCardOrder(sides, { arrange: spreadPairs });

  return (
    <StudyFrame
      backTo={backTo}
      backLabel={backLabel}
      title={title}
      modeName="Front & back"
      tools={<ShuffleControls shuffled={shuffled} onShuffle={shuffleNow} onReset={reset} />}
      error={error}
    >
      <p className="study-note">
        Every card is asked <strong>twice</strong>: once from its front and once from its back.
      </p>
      {/* a new round (after a shuffle or reset) starts again from the first question */}
      <Questions key={round} entries={order} starred={starred} onToggleStar={toggle} />
    </StudyFrame>
  );
}

// One question at a time: see one side, flip to check the other, move on.
function Questions({ entries, starred, onToggleStar }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [instant, setInstant] = useState(false); // true for one frame: change cards without the flip animation

  const last = entries.length - 1;
  const { card, side } = entries[index];
  const other = side === 'front' ? 'back' : 'front';
  const name = (s) => (s === 'front' ? 'Front' : 'Back');

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const go = useCallback(
    (step) => {
      const target = index + step;
      if (target < 0 || target > last) return;
      setInstant(true);
      setIndex(target);
      setFlipped(false);
    },
    [index, last],
  );

  useEffect(() => {
    if (!instant) return undefined;
    const frame = requestAnimationFrame(() => setInstant(false));
    return () => cancelAnimationFrame(frame);
  }, [instant]);

  // Keyboard: space or up arrow flips, right arrow is next, left arrow is previous.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = event.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === ' ') {
        if (tag === 'BUTTON' || tag === 'A') return;
        event.preventDefault();
        flip();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        flip();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flip, go]);

  const release = (event) => {
    if (event.detail > 0) event.currentTarget.blur();
  };

  return (
    <>
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through the questions"
        aria-valuemin={1}
        aria-valuemax={entries.length}
        aria-valuenow={index + 1}
      >
        <span style={{ width: `${((index + 1) / entries.length) * 100}%` }} />
      </div>

      <p className="fb-direction">
        {name(side)} → {name(other)}
      </p>

      <div className="flash-stage">
        <div
          className={`flash-card${flipped ? ' flash-card--flipped' : ''}${instant ? ' flash-card--instant' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={`Question ${index + 1} of ${entries.length}, showing the ${flipped ? name(other) : name(side)}. Click to flip.`}
          onClick={flip}
          onKeyDown={(event) => {
            if (event.key === 'Enter') flip();
          }}
        >
          <div className="flash-face flash-face--front" aria-hidden={flipped}>
            <span className="flash-side">{name(side)}</span>
            <p className="flash-text">{sideText(card.content?.[side])}</p>
          </div>
          <div className="flash-face flash-face--back" aria-hidden={!flipped}>
            <span className="flash-side">{name(other)}</span>
            <p className="flash-text">{sideText(card.content?.[other])}</p>
          </div>
        </div>
        <StarButton starred={starred.has(card.id)} onToggle={() => onToggleStar(card)} />
      </div>

      <div className="flash-nav">
        <button
          type="button"
          className="flash-arrow"
          aria-label="Previous question"
          disabled={index === 0}
          onClick={(event) => {
            release(event);
            go(-1);
          }}
        >
          ←
        </button>
        <span className="flash-count">
          {index + 1} / {entries.length}
        </span>
        <button
          type="button"
          className="flash-arrow"
          aria-label="Next question"
          disabled={index === last}
          onClick={(event) => {
            release(event);
            go(1);
          }}
        >
          →
        </button>
      </div>

      <p className="flash-hint">Space or ↑ flips the card. ← and → move between questions.</p>
    </>
  );
}
