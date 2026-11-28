import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ShuffleControls from '../components/ShuffleControls';
import StarButton from '../components/StarButton';
import StudyFrame from '../components/StudyFrame';
import StudyLoader from '../components/StudyLoader';
import { useCardOrder } from '../hooks/useCardOrder';
import { useStarred } from '../hooks/useStarred';
import { checkAnswer, typeableCards } from '../utils/typeIt';

// Type-it-out mode. Routes:
//   /decks/:deckId/type-it-out   /decks/:deckId/subdecks/:sid/type-it-out   /flashcards/starred/type-it-out
// The front of a card is shown and the person types its back. This only works for SINGLE-WORD
// answers, so cards whose back is more than one word are left out (and the page says so).
export default function TypeItOutPage() {
  return <StudyLoader mode="type">{(set) => <TypeItOut set={set} />}</StudyLoader>;
}

function TypeItOut({ set }) {
  const { title, backTo, backLabel, cards: allCards } = set;
  const { starred, toggle, error } = useStarred(set.starred);
  const typeable = useMemo(() => typeableCards(allCards), [allCards]);
  const skipped = allCards.length - typeable.length;
  const { order, shuffled, round, shuffleNow, reset } = useCardOrder(typeable);

  const note = (
    <p className="study-note">
      <strong>Single-word answers only.</strong> Type the word on the back of each card. Cards whose
      back is more than one word are skipped
      {skipped > 0 ? ` (${skipped} skipped here)` : ''}.
    </p>
  );

  const frame = (children) => (
    <StudyFrame
      backTo={backTo}
      backLabel={backLabel}
      title={title}
      modeName="Type it out"
      tools={
        typeable.length > 1 ? (
          <ShuffleControls shuffled={shuffled} onShuffle={shuffleNow} onReset={reset} />
        ) : null
      }
      error={error}
    >
      {note}
      {children}
    </StudyFrame>
  );

  if (typeable.length === 0) {
    return frame(
      <div className="flash-message" role="status">
        <p>None of the cards here have a one-word back, so there is nothing to type.</p>
        <Link className="btn btn-type2" to={backTo}>
          ← {backLabel}
        </Link>
      </div>,
    );
  }

  return frame(<Run key={round} cards={order} starred={starred} onToggleStar={toggle} />);
}

// One run through the cards: one at a time, type the word, check it, move on.
function Run({ cards, starred, onToggleStar }) {
  const [queue, setQueue] = useState(cards); // the cards still to go through (or the missed ones on a retry)
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null); // null = not checked yet, else 'correct' | 'accent' | 'wrong'
  const [missed, setMissed] = useState([]);
  const [right, setRight] = useState(0);
  const inputRef = useRef(null);

  const card = queue[index]; // undefined once the run is finished

  // put the cursor in the box for every new card
  useEffect(() => {
    inputRef.current?.focus();
  }, [index, queue]);

  const expected = card?.content?.back?.text?.trim() ?? '';

  const settle = useCallback(
    (outcome) => {
      setResult(outcome);
      if (outcome === 'wrong') setMissed((prev) => [...prev, card]);
      else setRight((n) => n + 1);
      inputRef.current?.focus(); // so Enter goes on to the next card
    },
    [card],
  );

  function next() {
    setIndex((i) => i + 1);
    setTyped('');
    setResult(null);
  }

  // Enter in the box: check the answer; Enter again: next card.
  function onSubmit(event) {
    event.preventDefault();
    if (result !== null) {
      next();
    } else if (typed.trim()) {
      settle(checkAnswer(typed, expected));
    }
  }

  function restart(retry) {
    setQueue(retry);
    setIndex(0);
    setTyped('');
    setResult(null);
    setMissed([]);
    setRight(0);
  }

  if (!card) {
    const total = queue.length;
    return (
      <div className="flash-message" role="status">
        <p>
          <strong>All done!</strong>
        </p>
        <p>
          You typed {right} of {total} correctly ({Math.round((right / total) * 100)}%).
        </p>
        {missed.length > 0 && (
          <button type="button" className="btn btn-type1" onClick={() => restart(missed)}>
            Retry the {missed.length} you missed
          </button>
        )}{' '}
        <button type="button" className="btn btn-type2" onClick={() => restart(cards)}>
          Start again
        </button>
      </div>
    );
  }

  const multiWord = /\s/.test(typed.trim());

  return (
    <>
      <div
        className="flash-progress"
        role="progressbar"
        aria-label="Progress through the cards"
        aria-valuemin={0}
        aria-valuemax={queue.length}
        aria-valuenow={index + (result !== null ? 1 : 0)}
      >
        <span style={{ width: `${((index + (result !== null ? 1 : 0)) / queue.length) * 100}%` }} />
      </div>

      <div className="flash-stage">
        <div className="study-card">
          <span className="flash-side">
            Card {index + 1} of {queue.length}
          </span>
          <p className="flash-text">{card.content.front.text}</p>
        </div>
        <StarButton starred={starred.has(card.id)} onToggle={() => onToggleStar(card)} />
      </div>

      <form className="type-form" onSubmit={onSubmit}>
        <label className="type-label" htmlFor="type-answer">
          Your answer (one word)
        </label>
        <input
          id="type-answer"
          ref={inputRef}
          className={`type-input${result ? ` type-input--${result === 'wrong' ? 'wrong' : 'right'}` : ''}`}
          type="text"
          value={typed}
          readOnly={result !== null}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(event) => setTyped(event.target.value)}
        />
        {multiWord && result === null && (
          <p className="type-warning" role="status">
            Answers here are a single word.
          </p>
        )}

        <div className="study-actions">
          {result === null ? (
            <>
              <button type="button" className="btn btn-type2" onClick={() => settle('wrong')}>
                Show answer
              </button>
              <button type="submit" className="btn btn-type1" disabled={!typed.trim()}>
                Check
              </button>
            </>
          ) : (
            <button type="submit" className="btn btn-type1">
              {index + 1 === queue.length ? 'Finish' : 'Next card'}
            </button>
          )}
        </div>
      </form>

      <p className="study-feedback" role="status" aria-live="polite">
        {result === 'correct' && '✓ Correct!'}
        {result === 'accent' && `✓ Right word, but check the accents: “${expected}”.`}
        {result === 'wrong' &&
          (typed.trim()
            ? `✗ Not quite. You typed “${typed.trim()}”. The answer is “${expected}”.`
            : `The answer is “${expected}”.`)}
      </p>
    </>
  );
}
