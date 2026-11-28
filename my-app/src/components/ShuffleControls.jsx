import './StudyModes.css';

// The "Shuffle" button (and "Original order" once shuffled) that sits above the card in every
// study mode. Shuffling again always gives a new order.
// onReset is optional: Repetition mode has no "original order" (the scheduler decides it).
export default function ShuffleControls({ shuffled, onShuffle, onReset, disabled = false, label = 'Shuffle' }) {
  // after a mouse click let go of focus, so the space bar flips / continues instead of pressing this again
  const release = (event) => {
    if (event.detail > 0) event.currentTarget.blur();
  };

  return (
    <div className="study-tools">
      <button
        type="button"
        className="btn btn-type2 study-tool"
        aria-pressed={shuffled}
        disabled={disabled}
        onClick={(event) => {
          release(event);
          onShuffle();
        }}
      >
        <span aria-hidden="true">🔀 </span>
        {shuffled ? `${label} again` : label}
      </button>
      {shuffled && onReset && (
        <button
          type="button"
          className="btn btn-type2 study-tool"
          onClick={(event) => {
            release(event);
            onReset();
          }}
        >
          Original order
        </button>
      )}
    </div>
  );
}
