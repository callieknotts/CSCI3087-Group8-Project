import { useState } from 'react';
import Button from './Button';
import TextField from './TextField';
import { ApiError, updateDeck, deleteDeck } from '../api/decksApi';

// One deck in the list. It can be viewed, edited in place, or asked to confirm a delete.
export default function DeckItem({
  deck,
  takenNames, // names of the user's other decks
  onUpdated,
  onDeleted,
  onUnauthorized,
}) {
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirmDelete'
  const [name, setName] = useState(deck.deckname);
  const [description, setDescription] = useState(deck.description ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function startEdit() {
    setName(deck.deckname);
    setDescription(deck.description ?? '');
    setError('');
    setMode('edit');
  }

  function cancel() {
    setError('');
    setMode('view');
  }

  // Runs a request, then onSuccess with its result. An expired session sends the
  // person back to the login page; any other problem is shown on this deck.
  async function perform(call, onSuccess) {
    setError('');
    setBusy(true);
    try {
      onSuccess(await call());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        onUnauthorized();
      } else {
        setError(e.message || 'Something went wrong. Try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    const newName = name.trim();
    const newDescription = description.trim() || null;

    if (!newName) {
      setError('Deck name is required.');
      return;
    }
    if (newName !== deck.deckname && takenNames.includes(newName)) {
      setError(`You already have a deck named "${newName}".`);
      return;
    }

    // Send only what changed. The backend rejects an update with nothing in it.
    const changes = {};
    if (newName !== deck.deckname) {
      changes.deckname = newName;
    }
    if (newDescription !== (deck.description || null)) {
      changes.description = newDescription;
    }
    if (Object.keys(changes).length === 0) {
      setMode('view');
      return;
    }

    await perform(
      () => updateDeck(deck.id, changes),
      (updated) => {
        onUpdated(updated);
        setMode('view');
      }
    );
  }

  async function handleDelete() {
    await perform(
      () => deleteDeck(deck.id),
      () => onDeleted(deck.id)
    );
  }

  return (
    <li className="deck-item">
      {mode === 'edit' ? (
        <form className="deck-edit" onSubmit={handleSave} noValidate>
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
          <div className="deck-actions">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="type2" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="deck-item__text">
            <h2 className="deck-item__name">{deck.deckname}</h2>
            {deck.description && (
              <p className="deck-item__description">{deck.description}</p>
            )}
          </div>

          {mode === 'confirmDelete' ? (
            <div className="deck-actions" role="group" aria-label="Confirm delete">
              <span>Delete this deck?</span>
              <Button onClick={handleDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Yes, delete'}
              </Button>
              <Button variant="type2" onClick={cancel} disabled={busy}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="deck-actions">
              <Button variant="type2" onClick={startEdit}>
                Edit
              </Button>
              <Button variant="type2" onClick={() => setMode('confirmDelete')}>
                Delete
              </Button>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
