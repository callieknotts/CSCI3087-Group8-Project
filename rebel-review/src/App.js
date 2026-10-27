import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateDeck from './ui/components/CreateDeck';
import DeckPage from './ui/pages/DeckPage';
import { deckService } from './compositionRoot';

function App() {
  const [decks, setDecks] = useState([]);

  useEffect(() => {
    deckService.getAllDecks().then(setDecks);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>My Decks</h1>
              <CreateDeck
                deckService={deckService}
                onDeckCreated={(deck) => setDecks([...decks, deck])}
              />
              <ul>
                {decks.map((deck) => (
                  <li key={deck.id}>
                    <Link to={`/deck/${deck.id}`}>{deck.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          }
        />
        <Route path="/deck/:deckId" element={<DeckPage decks={decks} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;