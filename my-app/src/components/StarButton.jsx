// The star on the top-right corner of a card (same button in every study mode).
// Put it inside an element with class "flash-stage" so it sits on the card's corner.
// After a mouse click it lets go of focus, so the space bar doesn't press it again.
export default function StarButton({ starred, onToggle }) {
  return (
    <button
      type="button"
      className={`flash-star${starred ? ' flash-star--on' : ''}`}
      aria-pressed={starred}
      aria-label={starred ? 'Remove star from this card' : 'Star this card'}
      onClick={(event) => {
        if (event.detail > 0) event.currentTarget.blur();
        onToggle();
      }}
    >
      {starred ? '★' : '☆'}
    </button>
  );
}
