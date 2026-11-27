import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import TextField from '../components/TextField';
import Button from '../components/Button';
import {
  listDecks,
  createDeck,
  updateDeck,
  deleteDeck,
  listSubdecks,
  createSubdeck,
  updateSubdeck,
  deleteSubdeck,
  listCards,
  createCard,
  updateCard,
  deleteCard,
} from '../api/decksApi';
import './ManagePage.css';

// The backend currently returns HTTP 500 when a deck has no subdecks.
// For this endpoint only, treat that response as an empty list.
async function getSubdecks(deckId) {
  return await listSubdecks(deckId);
}

// Converts CSV text into rows, including values wrapped in double quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') i += 1;

      row.push(value);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);

      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);

  // Remove a first row containing the optional front,back headings.
  if (
    rows.length > 0 &&
    rows[0][0]?.trim().toLowerCase() === 'front' &&
    rows[0][1]?.trim().toLowerCase() === 'back'
  ) {
    rows.shift();
  }

  return rows;
}

function getCardSideText(card, side) {
  // Card text is nested inside card.content.front/back in the backend response.
  return card.content?.[side]?.text ?? '';
}

export default function ManagePage() {
  const { onUnauthorized } = useOutletContext();
  const onUnauthorizedRef = useRef(onUnauthorized);

  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [selectedSubdeckId, setSelectedSubdeckId] = useState('');

  const [subdecks, setSubdecks] = useState([]);
  const [cards, setCards] = useState([]);

  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [subdeckName, setSubdeckName] = useState('');

  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [editingCardId, setEditingCardId] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [reloadDecks, setReloadDecks] = useState(0);
  const [reloadSubdecks, setReloadSubdecks] = useState(0);
  const [reloadCards, setReloadCards] = useState(0);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  // Load decks when the page opens or a deck is created/deleted.
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const result = await listDecks();
        if (ignore) return;

        setDecks(result);

        // Keep the current selection if it still exists.
        setSelectedDeckId((current) => {
          if (result.some((deck) => deck.id === current)) return current;
          return result[0]?.id ?? '';
        });
      } catch (err) {
        if (ignore) return;

        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }

        setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [reloadDecks]);

  // Load subdecks when the selected deck changes.
  useEffect(() => {
    let ignore = false;

    async function load() {
      setSubdecks([]);
      setSelectedSubdeckId('');

      if (!selectedDeckId) return;

      try {
        const result = await getSubdecks(selectedDeckId);
        if (!ignore) setSubdecks(result);
      } catch (err) {
        if (ignore) return;

        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }

        setError(err.message);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [selectedDeckId, reloadSubdecks]);

  // Load cards for the selected deck and optional subdeck.
  useEffect(() => {
    let ignore = false;

    async function load() {
      setCards([]);

      if (!selectedDeckId) return;

      try {
        const result = await listCards(
          selectedDeckId,
          selectedSubdeckId || null,
        );

        if (!ignore) setCards(result);
      } catch (err) {
        if (ignore) return;

        if (err.status === 401) {
          onUnauthorizedRef.current();
          return;
        }

        setError(err.message);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [selectedDeckId, selectedSubdeckId, reloadCards]);

  function refreshDecks() {
    setReloadDecks((n) => n + 1);
  }

  function refreshSubdecks() {
    setReloadSubdecks((n) => n + 1);
  }

  function refreshCards() {
    setReloadCards((n) => n + 1);
  }

  async function handleCreateDeck(e) {
    e.preventDefault();

    if (!deckName.trim()) {
      setError('Enter a deck name.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const created = await createDeck(
        deckName.trim(),
        deckDescription.trim() || null,
      );

      setDeckName('');
      setDeckDescription('');
      setSelectedDeckId(created.id);
      setMessage('Deck created.');
      refreshDecks();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameDeck() {
    const deck = decks.find((item) => item.id === selectedDeckId);
    if (!deck) return;

    const newName = window.prompt('New deck name:', deck.deckname);
    if (newName === null || !newName.trim()) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateDeck(deck.id, { deckname: newName.trim() });
      setMessage('Deck renamed.');
      refreshDecks();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDeck() {
    const deck = decks.find((item) => item.id === selectedDeckId);
    if (!deck) return;

    const confirmed = window.confirm(
      `Delete "${deck.deckname}" and its contents?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteDeck(deck.id);
      setSelectedDeckId('');
      setMessage('Deck deleted.');
      refreshDecks();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateSubdeck(e) {
    e.preventDefault();

    if (!selectedDeckId) {
      setError('Choose a deck first.');
      return;
    }

    if (!subdeckName.trim()) {
      setError('Enter a subdeck name.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await createSubdeck(selectedDeckId, subdeckName.trim());
      setSubdeckName('');
      setMessage('Subdeck created.');
      refreshSubdecks();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRenameSubdeck() {
    const subdeck = subdecks.find(
      (item) => item.id === selectedSubdeckId,
    );
    if (!subdeck) return;

    const newName = window.prompt(
      'New subdeck name:',
      subdeck.subdeckname,
    );
    if (newName === null || !newName.trim()) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateSubdeck(
        selectedDeckId,
        subdeck.id,
        { subdeckname: newName.trim() },
      );
      setMessage('Subdeck renamed.');
      refreshSubdecks();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubdeck() {
    const subdeck = subdecks.find(
      (item) => item.id === selectedSubdeckId,
    );
    if (!subdeck) return;

    const confirmed = window.confirm(
      `Delete subdeck "${subdeck.subdeckname}"?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteSubdeck(selectedDeckId, subdeck.id);
      setSelectedSubdeckId('');
      setMessage('Subdeck deleted.');
      refreshSubdecks();
      refreshCards();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function clearCardForm() {
    setFrontText('');
    setBackText('');
    setEditingCardId('');
  }

  function startEditingCard(card) {
    setEditingCardId(card.id);
    setFrontText(getCardSideText(card, 'front'));
    setBackText(getCardSideText(card, 'back'));
    setError('');
    setMessage('');
  }

  async function handleSaveCard(e) {
    e.preventDefault();

    if (!selectedDeckId) {
      setError('Choose a deck first.');
      return;
    }

    if (!frontText.trim() || !backText.trim()) {
      setError('Enter both the front and back of the card.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingCardId) {
        await updateCard(selectedDeckId, editingCardId, {
          front_text: frontText.trim(),
          back_text: backText.trim(),
        });
        setMessage('Card updated.');
      } else {
        await createCard(selectedDeckId, {
          front_text: frontText.trim(),
          back_text: backText.trim(),
          front_image: null,
          back_image: null,
          position: cards.length,
          subdeck_id: selectedSubdeckId || null,
        });
        setMessage('Card created.');
      }

      clearCardForm();
      refreshCards();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCard(cardId) {
    const confirmed = window.confirm('Delete this flashcard?');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteCard(selectedDeckId, cardId);
      if (editingCardId === cardId) clearCardForm();
      setMessage('Card deleted.');
      refreshCards();
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCSVImport(e) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file || !selectedDeckId) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const rows = parseCSV(await file.text());

      if (rows.length === 0) {
        setError('The CSV file has no flashcards.');
        return;
      }

      let imported = 0;

      for (const row of rows) {
        const front = row[0]?.trim() ?? '';
        const back = row[1]?.trim() ?? '';

        if (!front || !back) continue;

        await createCard(selectedDeckId, {
          front_text: front,
          back_text: back,
          front_image: null,
          back_image: null,
          position: cards.length + imported,
          subdeck_id: selectedSubdeckId || null,
        });

        imported += 1;
      }

      if (imported === 0) {
        setError('No valid rows found. Each row needs front and back text.');
      } else {
        setMessage(`Imported ${imported} flashcard${imported === 1 ? '' : 's'}.`);
        refreshCards();
      }
    } catch (err) {
      if (err.status === 401) onUnauthorizedRef.current();
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
  const selectedSubdeck = subdecks.find(
    (subdeck) => subdeck.id === selectedSubdeckId,
  );

  return (
    <main className="manage-page">
      <header className="manage-header">
        <h1>Manage</h1>
        <p>Create and organize your decks and flashcards.</p>
      </header>

      {error && (
        <p className="manage-message manage-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="manage-message manage-success" role="status">
          {message}
        </p>
      )}

      <section className="manage-section">
        <h2>Create a deck</h2>

        <form className="manage-form" onSubmit={handleCreateDeck}>
          <TextField
            label="Deck name"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g. Biology"
          />

          <div className="manage-field">
            <label htmlFor="deck-description">Description (optional)</label>
            <textarea
              id="deck-description"
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              placeholder="What are you studying?"
              rows={3}
            />
          </div>

          <Button type="submit" disabled={saving}>
            Create deck
          </Button>
        </form>
      </section>

      <section className="manage-section">
        <h2>Your decks</h2>

        {loading ? (
          <p>Loading decks…</p>
        ) : decks.length === 0 ? (
          <p>You haven't created any decks yet.</p>
        ) : (
          <>
            <div className="manage-field">
              <label htmlFor="manage-deck-select">Selected deck</label>
              <select
                id="manage-deck-select"
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
              >
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.deckname}
                  </option>
                ))}
              </select>
            </div>

            {selectedDeck && (
              <div className="manage-actions">
                <Button
                  variant="type2"
                  disabled={saving}
                  onClick={handleRenameDeck}
                >
                  Rename deck
                </Button>
                <Button
                  variant="type2"
                  disabled={saving}
                  onClick={handleDeleteDeck}
                >
                  Delete deck
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {selectedDeckId && (
        <section className="manage-section">
          <h2>Subdecks</h2>

          <form className="manage-inline-form" onSubmit={handleCreateSubdeck}>
            <TextField
              label="New subdeck"
              value={subdeckName}
              onChange={(e) => setSubdeckName(e.target.value)}
              placeholder="e.g. Chapter 1"
            />
            <Button type="submit" disabled={saving}>
              Add subdeck
            </Button>
          </form>

          <div className="manage-field">
            <label htmlFor="manage-subdeck-select">
              Add cards to
            </label>
            <select
              id="manage-subdeck-select"
              value={selectedSubdeckId}
              onChange={(e) => setSelectedSubdeckId(e.target.value)}
            >
              <option value="">Main deck (no subdeck)</option>
              {subdecks.map((subdeck) => (
                <option key={subdeck.id} value={subdeck.id}>
                  {subdeck.subdeckname}
                </option>
              ))}
            </select>
          </div>

          {selectedSubdeck && (
            <div className="manage-actions">
              <Button
                variant="type2"
                disabled={saving}
                onClick={handleRenameSubdeck}
              >
                Rename subdeck
              </Button>
              <Button
                variant="type2"
                disabled={saving}
                onClick={handleDeleteSubdeck}
              >
                Delete subdeck
              </Button>
            </div>
          )}
        </section>
      )}

      {selectedDeckId && (
        <section className="manage-section">
          <h2>{editingCardId ? 'Edit flashcard' : 'Add flashcard'}</h2>

          <form className="manage-form" onSubmit={handleSaveCard}>
            <TextField
              label="Front"
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              placeholder="Question or term"
            />

            <TextField
              label="Back"
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              placeholder="Answer or definition"
            />

            <div className="manage-actions">
              <Button type="submit" disabled={saving}>
                {editingCardId ? 'Save changes' : 'Add card'}
              </Button>

              {editingCardId && (
                <Button
                  variant="type2"
                  disabled={saving}
                  onClick={clearCardForm}
                >
                  Cancel edit
                </Button>
              )}
            </div>
          </form>

          <div className="manage-import">
            <label htmlFor="card-csv">Import flashcards from CSV</label>
            <input
              id="card-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={handleCSVImport}
              disabled={saving}
            />
            <p>CSV columns: front,back. You can include a header row.</p>
          </div>
        </section>
      )}

      {selectedDeckId && (
        <section className="manage-section">
          <h2>Flashcards ({cards.length})</h2>

          {cards.length === 0 ? (
            <p>No cards in this selection yet.</p>
          ) : (
            <ul className="manage-card-list">
              {cards.map((card) => (
                <li className="manage-card" key={card.id}>
                  <div className="manage-card-content">
                    <strong>{getCardSideText(card, 'front') || 'Image card'}</strong>
                    <p>{getCardSideText(card, 'back') || 'Image card'}</p>
                  </div>

                  <div className="manage-actions">
                    <Button
                      variant="type2"
                      disabled={saving}
                      onClick={() => startEditingCard(card)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="type2"
                      disabled={saving}
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
