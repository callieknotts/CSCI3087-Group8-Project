// bring in React's state tool, the shared button and text box,
// and the backend calls for renaming and deleting a deck
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
  // which version of the row is showing, the text in the edit boxes,
  // any error message, and whether a request is running
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirmDelete'
  const [name, setName] = useState(deck.deckname);
  const [description, setDescription] = useState(deck.description ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // switch to edit mode, with the boxes filled in with the deck's current values
  function startEdit() {
    setName(deck.deckname);
    setDescription(deck.description ?? '');
    setError('');
    setMode('edit');
  }

  // leave edit or delete mode without changing anything
  function cancel() {
    setError('');
    setMode('view');
  }

  // Runs a request, then onSuccess with its result. An expired session sends the
  // person back to the login page; any other problem is shown on this deck.
  async function perform(call, onSuccess) {
    // clear any old error and mark that a request is running
    setError('');
    setBusy(true);
    try {
      // run the request and pass its result on if it worked
      onSuccess(await call());
    } catch (e) {
      // 401 means the session ended; anything else shows a message on this deck
      if (e instanceof ApiError && e.status === 401) {
        onUnauthorized();
      } else {
        setError(e.message || 'Something went wrong. Try again.');
      }
    } finally {
      // whatever happened, the request is finished
      setBusy(false);
    }
  }

  // runs when the edit form is saved
  async function handleSave(e) {
    // stop the form from reloading the page, and clean up the typed values
    e.preventDefault();
    const newName = name.trim();
    const newDescription = description.trim() || null;

    // the name can't be empty, and can't match another deck's name
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
    // if nothing changed, just go back to the normal view without sending anything
    if (Object.keys(changes).length === 0) {
      setMode('view');
      return;
    }

    // send the changes; on success, give the updated deck to the list and go back to the normal view
    await perform(
      () => updateDeck(deck.id, changes),
      (updated) => {
        onUpdated(updated);
        setMode('view');
      }
    );
  }

  // runs when "Yes, delete" is clicked: send the delete, then tell the list to remove the deck
  async function handleDelete() {
    await perform(
      () => deleteDeck(deck.id),
      () => onDeleted(deck.id)
    );
  }

  return (
    <li className="deck-item">
      {/* edit mode shows a form; every other mode shows the deck's name and description */}
      {mode === 'edit' ? (
        // the edit form: name and description boxes, with Save and Cancel buttons
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
          {/* the deck's name, and its description if it has one */}
          <div className="deck-item__text">
            <h2 className="deck-item__name">{deck.deckname}</h2>
            {deck.description && (
              <p className="deck-item__description">{deck.description}</p>
            )}
          </div>

          {/* the buttons: a delete confirmation, or the normal Edit and Delete buttons */}
          {mode === 'confirmDelete' ? (
            // asks "Delete this deck?" with a confirm button and a cancel button
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
            // the normal buttons: Edit opens the form, Delete asks for confirmation
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

      {/* an error message for this deck, shown only if there is one */}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
