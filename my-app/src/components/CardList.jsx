import { sideText } from '../utils/cardText';

// A read-only list of cards, each showing its front and its back side by side.
export default function CardList({ cards, emptyText = 'No cards yet.' }) {
  if (cards.length === 0) {
    return <p className="card-list-empty">{emptyText}</p>;
  }

  return (
    <ul className="card-list">
      {cards.map((card) => (
        <li key={card.id} className="card-row">
          <div className="card-side">
            <span className="card-side-label">Front</span>
            <p>{sideText(card.content?.front)}</p>
          </div>
          <div className="card-side">
            <span className="card-side-label">Back</span>
            <p>{sideText(card.content?.back)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
