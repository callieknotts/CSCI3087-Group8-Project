import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import TextField from './TextField';
import DeckItem from './DeckItem';
import { ApiError, listDecks, createDeck } from '../api/decksApi';
import './DeckList.css';

// Shows the logged-in user's decks and lets them add, rename and delete decks.
// onUnauthorized runs when the server says the session has ended (401).
export default function DeckList({ onUnauthorized }) {
  const [decks, setDecks] = useState(null); // null while the first load is running
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0); // goes up by one for each load try

  // Keep the latest onUnauthorized in a ref so the loading effect below
  // does not run again every time the parent re-renders.
  const onUnauthorizedRef = useRef(onUnauthorized);
  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  });

  // Load the decks when the page opens, and again when "Try again" is pressed.
  useEffect(() => {
    let ignore = false; // stops an old request from changing state after a newer one started
    listDecks()
      .then((loaded) => {
        if (!ignore) setDecks(loaded);
      })
      .catch((e) => {
        if (ignore) return;
        if (e instanceof ApiError && e.status === 401) {
          onUnauthorizedRef.current();
        } else {
          setLoadError(e.message || 'Could not load your decks.');
        }
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retryLoad() {
    setLoadError('');
    setAttempt(attempt + 1);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');

    const deckname = name.trim();
    if (!deckname) {
      setFormError('Deck name is required.');
      return;
    }
    // The backend answers a repeated name with a generic server error,
    // so catch it here first and say what is wrong.
    if (decks.some((d) => d.deckname === deckname)) {
      setFormError(`You already have a deck named "${deckname}".`);
      return;
    }

    setSubmitting(true);
    try {
      const deck = await createDeck(deckname, description.trim() || null);
      setDecks([...decks, deck]);
      setName('');
      setDescription('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized();
      } else if (err instanceof ApiError && err.status === 500) {
        setFormError(
          'Could not create the deck. Make sure you do not already have one with that name.'
        );
      } else {
        setFormError(err.message || 'Could not create the deck.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function replaceDeck(updated) {
    setDecks(decks.map((d) => (d.id === updated.id ? updated : d)));
  }

  function removeDeck(deckId) {
    setDecks(decks.filter((d) => d.id !== deckId));
  }

  if (loadError) {
    return (
      <section className="deck-list">
        <p className="form-error" role="alert">
          {loadError}
        </p>
        <Button onClick={retryLoad}>Try again</Button>
      </section>
    );
  }

  if (decks === null) {
    return (
      <section className="deck-list">
        <p className="deck-empty">Loading decks…</p>
      </section>
    );
  }

  return (
    <section className="deck-list">
      <form className="deck-form" onSubmit={handleCreate} noValidate>
        <h2>New deck</h2>
        <TextField
          label="Deck name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add deck'}
        </Button>
      </form>

      {decks.length === 0 ? (
        <p className="deck-empty">You don't have any decks yet. Add your first one above.</p>
      ) : (
        <ul className="deck-items">
          {decks.map((deck) => (
            <DeckItem
              key={deck.id}
              deck={deck}
              takenNames={decks.filter((d) => d.id !== deck.id).map((d) => d.deckname)}
              onUpdated={replaceDeck}
              onDeleted={removeDeck}
              onUnauthorized={onUnauthorized}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
