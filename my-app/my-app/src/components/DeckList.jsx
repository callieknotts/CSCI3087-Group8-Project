// bring in React's tools, the shared button and text box, the deck row component,
// the backend calls, and this screen's styles
import { useEffect, useRef, useState } from 'react';
import Button from './Button';
import TextField from './TextField';
import DeckItem from './DeckItem';
import { ApiError, listDecks, createDeck } from '../api/decksApi';
import './DeckList.css';

// Shows the logged-in user's decks and lets them add, rename and delete decks.
// onUnauthorized runs when the server says the session has ended (401).
export default function DeckList({ onUnauthorized }) {
  // the loaded decks and any load error
  const [decks, setDecks] = useState(null); // null while the first load is running
  const [loadError, setLoadError] = useState('');
  // the "New deck" form: the typed name and description, any form error, and whether it's sending
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
    // ask the backend for the decks, and save them if this request is still the current one
    listDecks()
      .then((loaded) => {
        if (!ignore) setDecks(loaded);
      })
      // on an error: a 401 sends the user back to login, anything else shows a message
      .catch((e) => {
        if (ignore) return;
        if (e instanceof ApiError && e.status === 401) {
          onUnauthorizedRef.current();
        } else {
          setLoadError(e.message || 'Could not load your decks.');
        }
      });
    // cleanup: runs when the page closes or the load restarts
    return () => {
      ignore = true;
    };
  }, [attempt]);

  // "Try again": clear the error and bump the counter so the load runs again
  function retryLoad() {
    setLoadError('');
    setAttempt(attempt + 1);
  }

  // runs when the "New deck" form is submitted
  async function handleCreate(e) {
    // stop the form from reloading the page, and clear any old error
    e.preventDefault();
    setFormError('');

    // the name must not be empty (spaces at the ends are ignored)
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

    // send the new deck to the backend, then add it to the list and clear the form
    setSubmitting(true);
    try {
      const deck = await createDeck(deckname, description.trim() || null);
      setDecks([...decks, deck]);
      setName('');
      setDescription('');
    } catch (err) {
      // 401: back to login; 500: most likely a repeated name; anything else: show its message
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
      // whatever happened, the form can be used again
      setSubmitting(false);
    }
  }

  // swap in the updated version of a deck after it was renamed
  function replaceDeck(updated) {
    setDecks(decks.map((d) => (d.id === updated.id ? updated : d)));
  }

  // take a deck out of the list after it was deleted
  function removeDeck(deckId) {
    setDecks(decks.filter((d) => d.id !== deckId));
  }

  // if loading failed: show the error with a "Try again" button
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

  // while the decks are still loading: show a loading message
  if (decks === null) {
    return (
      <section className="deck-list">
        <p className="deck-empty">Loading decks…</p>
      </section>
    );
  }

  // the main screen: the "New deck" form on top, and the list of decks below it
  return (
    <section className="deck-list">
      {/* the form for adding a deck: name, optional description, an error message and a submit button */}
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

      {/* a message if there are no decks yet, otherwise one row per deck */}
      {decks.length === 0 ? (
        <p className="deck-empty">You don't have any decks yet. Add your first one above.</p>
      ) : (
        <ul className="deck-items">
          {decks.map((deck) => (
            // each row gets the other decks' names (so a rename can't repeat one)
            // and functions to call after it is renamed, deleted or the session ends
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
