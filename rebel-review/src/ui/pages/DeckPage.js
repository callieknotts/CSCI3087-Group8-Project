import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import CreateCard from "../components/CreateCard";
import { cardService } from "../../compositionRoot";

function DeckPage({ decks }) {
  const { deckId } = useParams();
  const deck = decks.find((d) => d.id === deckId);
  const [cards, setCards] = useState([]);

  // Load this deck's saved cards when the page opens (or the deck changes)
  useEffect(() => {
    cardService.getCardsByDeck(deckId).then(setCards);
  }, [deckId]);

  if (!deck) {
    return (
      <div>
        <p>Deck not found.</p>
        <Link to="/">Back to decks</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/">Back to decks</Link>
      <h1>{deck.name}</h1>

      <CreateCard
        cardService={cardService}
        deckId={deck.id}
        onCardCreated={(card) => setCards([...cards, card])}
      />

      <h2>Cards ({cards.length})</h2>
      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            {card.front} → {card.back}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DeckPage;
