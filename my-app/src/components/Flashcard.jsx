import './Flashcard.css';

// One card that flips between front and back.
// Click it (or press Space / Enter) to flip.
export default function Flashcard({ front, back, flipped, onFlip }) {
  return (
    <button
      type="button"
      className={`flashcard ${flipped ? 'is-flipped' : ''}`}
      onClick={onFlip}
      aria-label={flipped ? 'Showing answer. Click to show question.' : 'Showing question. Click to show answer.'}
    >
      <span className="flashcard__inner">
        <span className="flashcard__face flashcard__front">
          <span className="flashcard__label">Front</span>
          <span className="flashcard__text">{front}</span>
        </span>
        <span className="flashcard__face flashcard__back">
          <span className="flashcard__label">Back</span>
          <span className="flashcard__text">{back}</span>
        </span>
      </span>
    </button>
  );
}
