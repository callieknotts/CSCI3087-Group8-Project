// The screen for a single deck. It loads the deck
// through cardService. It shows the deck's name, the CreateCard form, 
// and a list of cardItem rows, each with its own edit and delete buttons.

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import CreateCard from "../components/CreateCard";
import CardItem from "../components/CardItem";
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
          <CardItem
            key={card.id}
            card={card}
            cardService={cardService}
            onCardUpdated={(updated) =>
              setCards(cards.map((c) => (c.id === updated.id ? updated : c)))
            }
            onCardDeleted={(id) => setCards(cards.filter((c) => c.id !== id))}
          />
        ))}
      </ul>
    </div>
  );
}

export default DeckPage;