//is one row in the deck list on the deck manager screen. 
// It shows a single deck’s name and description

// React's useState hook, the shared Button/TextField components, and the deck API calls.
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
  // What this deck is currently showing, plus the text boxes used while editing.
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirmDelete'
  const [name, setName] = useState(deck.deckname);
  const [description, setDescription] = useState(deck.description ?? '');
  // Error message to show on this deck, and whether a request is in progress (disables buttons).
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Switch into edit mode, starting the text boxes from the deck's saved values.
  function startEdit() {
    setName(deck.deckname);
    setDescription(deck.description ?? '');
    setError('');
    setMode('edit');
  }

  // Leave edit/delete mode without saving and clear any error.
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

  // Runs when the Edit form is submitted: check the input, work out what changed, then save.
  async function handleSave(e) {
    e.preventDefault();
    // Clean up the typed values (empty description becomes null).
    const newName = name.trim();
    const newDescription = description.trim() || null;

    // Stop early if the name is blank or already used by another deck.
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
    // Nothing changed, so skip the request and go back to view mode.
    if (Object.keys(changes).length === 0) {
      setMode('view');
      return;
    }

    // Send the update; on success tell the parent list and return to view mode.
    await perform(
      () => updateDeck(deck.id, changes),
      (updated) => {
        onUpdated(updated);
        setMode('view');
      }
    );
  }

  // Runs when the person confirms the delete; tells the parent list to remove this deck.
  async function handleDelete() {
    await perform(
      () => deleteDeck(deck.id),
      () => onDeleted(deck.id)
    );
  }

  // What shows on screen: an edit form, or the deck's text with Edit/Delete buttons.
  return (
    <li className="deck-item">
      {mode === 'edit' ? (
        // Edit mode: name and description boxes with Save and Cancel.
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
          {/* View mode: the deck's name and (if it has one) its description. */}
          <div className="deck-item__text">
            <h2 className="deck-item__name">{deck.deckname}</h2>
            {deck.description && (
              <p className="deck-item__description">{deck.description}</p>
            )}
          </div>

          {/* Delete mode shows a confirm question; otherwise show Edit and Delete buttons. */}
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

      {/* Shows any error message for this deck. */}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
