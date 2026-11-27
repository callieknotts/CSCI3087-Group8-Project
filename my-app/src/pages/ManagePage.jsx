import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
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

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = '';
  let insideQuotes = false;
  let i = 0;

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const firstLine = text.split(/\r?\n/)[0] || '';
  const delimiter =
    firstLine.split('\t').length > firstLine.split(',').length
      ? '\t'
      : firstLine.split(';').length > firstLine.split(',').length
        ? ';'
        : ',';

  for (; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (next === '"') {
          value += '"';
          i += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        value += char;
      }
    } else if (char === '"') {
      insideQuotes = true;
    } else if (char === delimiter) {
      row.push(value);
      value = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value !== '' || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''));

  if (
    nonEmptyRows.length > 0 &&
    ['front', 'question', 'term'].includes(
      (nonEmptyRows[0][0] || '').trim().toLowerCase(),
    )
  ) {
    nonEmptyRows.shift();
  }

  return nonEmptyRows;
}

function getCardSideText(card, side) {
  return card.content?.[side]?.text ?? card[side] ?? '';
}

function ModalDialog({ config, onClose }) {
  const [values, setValues] = useState(() =>
    (config.fields || []).map((field) => field.value || ''),
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleChange(index, nextValue) {
    setValues((prev) =>
      prev.map((item, idx) => (idx === index ? nextValue : item)),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const submittedValues = [...values];
    onClose();
    await config.onSubmit?.(submittedValues);
  }

  return (
    <div
      className="ov"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="dlg"
        role="dialog"
        aria-modal="true"
        onSubmit={handleSubmit}
      >
        <h2>{config.title}</h2>
        {config.message && <p>{config.message}</p>}
        {(config.fields || []).map((field, index) => (
          <label key={field.label}>
            {field.label}
            {field.multiline ? (
              <textarea
                value={values[index] ?? ''}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            ) : (
              <input
                value={values[index] ?? ''}
                onChange={(e) => handleChange(index, e.target.value)}
              />
            )}
          </label>
        ))}
        <div className="btns">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={config.danger ? 'danger' : 'primary'}
          >
            {config.ok || 'OK'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ManagePage() {
  const { onUnauthorized } = useOutletContext();
  const onUnauthorizedRef = useRef(onUnauthorized);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [decks, setDecks] = useState([]);
  const [subdecksByDeck, setSubdecksByDeck] = useState({});
  const [rootCardsByDeck, setRootCardsByDeck] = useState({});
  const [subdeckCardsById, setSubdeckCardsById] = useState({});
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [openDecks, setOpenDecks] = useState({});

  const [newDeckName, setNewDeckName] = useState('');
  const [subdeckName, setSubdeckName] = useState('');
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false });
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  function showToast(message) {
    setToast({ message, visible: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 2400);
  }

  function handleApiError(err) {
    if (err?.status === 401) {
      onUnauthorizedRef.current?.();
      return true;
    }
    showToast(err?.message || 'Something went wrong.');
    return false;
  }

  async function loadWorkspace(preferredDeckId = null, isInitial = false) {
    if (isInitial) setLoading(true);
    try {
      const deckList = await listDecks();
      setDecks(deckList);

      const subEntries = await Promise.all(
        deckList.map(async (deck) => [deck.id, await listSubdecks(deck.id)]),
      );
      const subMap = Object.fromEntries(subEntries);
      setSubdecksByDeck(subMap);

      const rootCardEntries = await Promise.all(
        deckList.map(async (deck) => [deck.id, await listCards(deck.id, null)]),
      );
      setRootCardsByDeck(Object.fromEntries(rootCardEntries));

      const subCardEntries = [];
      for (const deck of deckList) {
        for (const sub of subMap[deck.id] || []) {
          subCardEntries.push([sub.id, await listCards(deck.id, sub.id)]);
        }
      }
      setSubdeckCardsById(Object.fromEntries(subCardEntries));

      setSelectedDeckId((current) => {
        if (preferredDeckId) return preferredDeckId;
        const validIds = [
          ...deckList.map((d) => d.id),
          ...Object.values(subMap)
            .flat()
            .map((s) => s.id),
        ];
        if (current && validIds.includes(current)) return current;
        return '';
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace(null, true);
  }, []);

  const subdeckToParent = {};
  for (const deck of decks) {
    for (const sub of subdecksByDeck[deck.id] || []) {
      subdeckToParent[sub.id] = deck.id;
    }
  }

  function findItem(id) {
    if (!id) return null;
    const rootDeck = decks.find((d) => d.id === id);
    if (rootDeck) {
      return {
        id: rootDeck.id,
        name: rootDeck.deckname,
        parentId: null,
        isSubdeck: false,
      };
    }
    const parentId = subdeckToParent[id];
    if (parentId) {
      const sub = (subdecksByDeck[parentId] || []).find((s) => s.id === id);
      if (sub) {
        return {
          id: sub.id,
          name: sub.subdeckname,
          parentId,
          isSubdeck: true,
        };
      }
    }
    return null;
  }

  function getSubdecksOf(deckId) {
    if (!deckId || subdeckToParent[deckId]) return [];
    return (subdecksByDeck[deckId] || []).map((s) => ({
      id: s.id,
      name: s.subdeckname,
      parentId: deckId,
      isSubdeck: true,
    }));
  }

  function getDirectCardCount(id) {
    if (!id) return 0;
    return subdeckToParent[id]
      ? (subdeckCardsById[id] || []).length
      : (rootCardsByDeck[id] || []).length;
  }

  function getTotalCardCount(id) {
    if (!id) return 0;
    if (subdeckToParent[id]) {
      return (subdeckCardsById[id] || []).length;
    }
    const direct = (rootCardsByDeck[id] || []).length;
    const subTotal = (subdecksByDeck[id] || []).reduce(
      (sum, sub) => sum + (subdeckCardsById[sub.id] || []).length,
      0,
    );
    return direct + subTotal;
  }

  function toggleDeckOpen(deckId) {
    setOpenDecks((prev) => ({ ...prev, [deckId]: !prev[deckId] }));
  }

  async function handleCreateDeck(e) {
    e.preventDefault();
    const trimmed = newDeckName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await createDeck(trimmed, null);
      setNewDeckName('');
      await loadWorkspace(created.id);
      showToast('Deck created');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSubdeck(parentId, name) {
    const trimmed = (name || '').trim();
    if (!trimmed || !parentId || saving) return;

    setSaving(true);
    try {
      const created = await createSubdeck(parentId, trimmed);
      setOpenDecks((prev) => ({ ...prev, [parentId]: true }));
      await loadWorkspace(created.id);
      showToast('Subdeck added');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  function handleRenameSelected() {
    const item = findItem(selectedDeckId);
    if (!item) return;

    setDialog({
      title: item.isSubdeck ? 'Rename subdeck' : 'Rename deck',
      fields: [{ label: 'Name', value: item.name }],
      ok: 'Save',
      onSubmit: async ([nextName]) => {
        const trimmed = (nextName || '').trim();
        if (!trimmed) return;
        setSaving(true);
        try {
          if (item.isSubdeck) {
            await updateSubdeck(item.parentId, item.id, {
              subdeckname: trimmed,
            });
          } else {
            await updateDeck(item.id, { deckname: trimmed });
          }
          await loadWorkspace(item.id);
          showToast('Renamed');
        } catch (err) {
          handleApiError(err);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  function handleDeleteSelected() {
    const item = findItem(selectedDeckId);
    if (!item) return;

    const subs = item.isSubdeck ? [] : getSubdecksOf(item.id);
    const cnt = getTotalCardCount(item.id);

    setDialog({
      title: item.isSubdeck ? 'Delete subdeck?' : 'Delete deck?',
      message: `This deletes ‘${item.name}’${
        !item.isSubdeck && subs.length > 0 ? ', its subdecks,' : ''
      } and ${cnt} card${cnt === 1 ? '' : 's'}. This can’t be undone.`,
      ok: 'Delete',
      danger: true,
      onSubmit: async () => {
        setSaving(true);
        try {
          if (item.isSubdeck) {
            await deleteSubdeck(item.parentId, item.id);
            await loadWorkspace(item.parentId);
          } else {
            await deleteDeck(item.id);
            await loadWorkspace(null);
          }
          showToast(item.isSubdeck ? 'Subdeck deleted' : 'Deck deleted');
        } catch (err) {
          handleApiError(err);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  async function handleAddCard(e) {
    e.preventDefault();
    const item = findItem(selectedDeckId);
    const front = frontText.trim();
    const back = backText.trim();
    if (!item || !front || !back || saving) return;

    const rootDeckId = item.isSubdeck ? item.parentId : item.id;
    const subdeckId = item.isSubdeck ? item.id : null;

    setSaving(true);
    try {
      await createCard(rootDeckId, {
        front_text: front,
        back_text: back,
        front_image: null,
        back_image: null,
        position: getDirectCardCount(item.id),
        subdeck_id: subdeckId,
      });
      setFrontText('');
      setBackText('');
      await loadWorkspace(item.id);
      showToast('Card added');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  function handleEditCard(card) {
    const item = findItem(selectedDeckId);
    if (!item) return;
    const rootDeckId = item.isSubdeck ? item.parentId : item.id;

    setDialog({
      title: 'Edit card',
      fields: [
        { label: 'Front', value: getCardSideText(card, 'front'), multiline: true },
        { label: 'Back', value: getCardSideText(card, 'back'), multiline: true },
      ],
      ok: 'Save',
      onSubmit: async ([nextFront, nextBack]) => {
        const f = (nextFront || '').trim();
        const b = (nextBack || '').trim();
        if (!f || !b) return;
        setSaving(true);
        try {
          await updateCard(rootDeckId, card.id, {
            front_text: f,
            back_text: b,
          });
          await loadWorkspace(item.id);
          showToast('Card updated');
        } catch (err) {
          handleApiError(err);
        } finally {
          setSaving(false);
        }
      },
    });
  }

  async function handleDeleteCard(cardId) {
    const item = findItem(selectedDeckId);
    if (!item || saving) return;
    const rootDeckId = item.isSubdeck ? item.parentId : item.id;

    setSaving(true);
    try {
      await deleteCard(rootDeckId, cardId);
      await loadWorkspace(item.id);
      showToast('Card deleted');
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleImportCSV(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    const item = findItem(selectedDeckId);
    if (!file || !item || saving) return;

    setSaving(true);
    try {
      const rows = parseCSV(await file.text());
      if (!rows.length) {
        showToast('That file has no rows');
        return;
      }

      const rootDeckId = item.isSubdeck ? item.parentId : item.id;
      const currentSubs = [...(subdecksByDeck[rootDeckId] || [])];
      let imported = 0;
      let skipped = 0;

      for (const r of rows) {
        const fr = (r[0] || '').trim();
        const bk = (r[1] || '').trim();
        if (!fr || !bk) {
          skipped += 1;
          continue;
        }

        let targetSubdeckId = item.isSubdeck ? item.id : null;
        if (!item.isSubdeck && r[2] && r[2].trim()) {
          const seg = r[2].trim().split('/')[0]?.trim();
          if (seg) {
            let match = currentSubs.find(
              (s) => s.subdeckname.toLowerCase() === seg.toLowerCase(),
            );
            if (!match) {
              match = await createSubdeck(rootDeckId, seg);
              currentSubs.push(match);
            }
            targetSubdeckId = match.id;
          }
        }

        const position = targetSubdeckId
          ? (subdeckCardsById[targetSubdeckId] || []).length + imported
          : (rootCardsByDeck[rootDeckId] || []).length + imported;

        await createCard(rootDeckId, {
          front_text: fr,
          back_text: bk,
          front_image: null,
          back_image: null,
          position,
          subdeck_id: targetSubdeckId,
        });
        imported += 1;
      }

      if (!item.isSubdeck) {
        setOpenDecks((prev) => ({ ...prev, [rootDeckId]: true }));
      }
      await loadWorkspace(item.id);
      showToast(
        `Imported ${imported} card${imported === 1 ? '' : 's'}${
          skipped
            ? `, skipped ${skipped} incomplete row${skipped === 1 ? '' : 's'}`
            : ''
        }`,
      );
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  }

  const selectedItem = findItem(selectedDeckId);
  const rootDeckItem = selectedItem
    ? selectedItem.isSubdeck
      ? findItem(selectedItem.parentId)
      : selectedItem
    : null;
  const subdecks =
    selectedItem && !selectedItem.isSubdeck
      ? getSubdecksOf(selectedItem.id)
      : [];
  const displayedCards = selectedItem
    ? selectedItem.isSubdeck
      ? subdeckCardsById[selectedItem.id] || []
      : rootCardsByDeck[selectedItem.id] || []
    : [];
  const totalInSelection = selectedItem ? getTotalCardCount(selectedItem.id) : 0;

  return (
    <div className="app manage-page">
      <aside>
        <h1>Decks</h1>
        <form id="newDeck" className="row" onSubmit={handleCreateDeck}>
          <input
            id="newDeckName"
            placeholder="New deck name"
            aria-label="New deck name"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            disabled={saving}
          />
          <button className="primary" type="submit" disabled={saving}>
            Add
          </button>
        </form>

        <div className="tree" id="tree">
          {loading ? (
            <p className="hint">Loading decks…</p>
          ) : decks.length === 0 ? (
            <p className="hint">No decks yet. Add one above.</p>
          ) : (
            <ul>
              {decks.map((deck) => {
                const subs = getSubdecksOf(deck.id);
                const hasKids = subs.length > 0;
                const isOpen = !!openDecks[deck.id];

                return (
                  <li key={deck.id}>
                    <div
                      className={`node${selectedDeckId === deck.id ? ' sel' : ''}`}
                      onClick={() => setSelectedDeckId(deck.id)}
                    >
                      <span
                        className="caret"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDeckOpen(deck.id);
                        }}
                      >
                        {hasKids ? (isOpen ? '▾' : '▸') : ''}
                      </span>
                      <span className="name">{deck.deckname}</span>
                      <span className="count">{getTotalCardCount(deck.id)}</span>
                      <button
                        type="button"
                        className="link add"
                        title="Add subdeck"
                        aria-label={`Add subdeck to ${deck.deckname}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialog({
                            title: 'New subdeck',
                            fields: [{ label: 'Name' }],
                            ok: 'Add subdeck',
                            onSubmit: ([name]) =>
                              handleAddSubdeck(deck.id, name),
                          });
                        }}
                      >
                        +
                      </button>
                    </div>

                    {hasKids && isOpen && (
                      <ul>
                        {subs.map((sub) => (
                          <li key={sub.id}>
                            <div
                              className={`node${
                                selectedDeckId === sub.id ? ' sel' : ''
                              }`}
                              onClick={() => setSelectedDeckId(sub.id)}
                            >
                              <span className="caret" />
                              <span className="name">{sub.name}</span>
                              <span className="count">
                                {getTotalCardCount(sub.id)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <main id="main">
        {!selectedItem ? (
          <div className="empty">
            <strong>Pick or create a deck</strong>
            <p>Add a deck on the left, then add subdecks and cards to it.</p>
          </div>
        ) : (
          <>
            {selectedItem.isSubdeck && rootDeckItem && (
              <div className="crumbs">
                <a
                  href={`#deck-${rootDeckItem.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedDeckId(rootDeckItem.id);
                    setOpenDecks((prev) => ({
                      ...prev,
                      [rootDeckItem.id]: true,
                    }));
                  }}
                >
                  {rootDeckItem.name}
                </a>{' '}
                /
              </div>
            )}

            <div className="row main-header-row">
              <h2>{selectedItem.name}</h2>
              <div className="row">
                <button
                  type="button"
                  id="rename"
                  onClick={handleRenameSelected}
                  disabled={saving}
                >
                  Rename
                </button>
                <button
                  type="button"
                  id="delDeck"
                  className="link del"
                  onClick={handleDeleteSelected}
                  disabled={saving}
                >
                  {selectedItem.isSubdeck ? 'Delete subdeck' : 'Delete deck'}
                </button>
              </div>
            </div>

            <p className="hint">
              {displayedCards.length} card
              {displayedCards.length === 1 ? '' : 's'} here, {totalInSelection}{' '}
              including subdecks
            </p>

            {!selectedItem.isSubdeck && (
              <>
                <h3>Subdecks</h3>
                {subdecks.length > 0 && (
                  <div>
                    {subdecks.map((sub) => (
                      <button
                        type="button"
                        key={sub.id}
                        className="sub"
                        onClick={() => {
                          setSelectedDeckId(sub.id);
                          setOpenDecks((prev) => ({
                            ...prev,
                            [selectedItem.id]: true,
                          }));
                        }}
                      >
                        {sub.name}{' '}
                        <span className="count">{getTotalCardCount(sub.id)}</span>
                      </button>
                    ))}
                  </div>
                )}
                <form
                  id="subForm"
                  className="row subdeck-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await handleAddSubdeck(selectedItem.id, subdeckName);
                    setSubdeckName('');
                  }}
                >
                  <input
                    id="subName"
                    placeholder="New subdeck name"
                    aria-label="New subdeck name"
                    value={subdeckName}
                    onChange={(e) => setSubdeckName(e.target.value)}
                    disabled={saving}
                  />
                  <button className="primary" type="submit" disabled={saving}>
                    Add subdeck
                  </button>
                </form>
              </>
            )}

            <h3>Add a card</h3>
            <p className="hint card-target-hint">
              Deck: <strong>{rootDeckItem?.name}</strong>
              {selectedItem.isSubdeck && (
                <>
                  {' '}
                  &nbsp; Subdeck: <strong>{selectedItem.name}</strong>
                </>
              )}
            </p>
            <form id="cardForm" className="panel" onSubmit={handleAddCard}>
              <div className="grid2">
                <div>
                  <label htmlFor="front">Front</label>
                  <textarea
                    id="front"
                    required
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div>
                  <label htmlFor="back">Back</label>
                  <textarea
                    id="back"
                    required
                    value={backText}
                    onChange={(e) => setBackText(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="tools">
                <button className="primary" type="submit" disabled={saving}>
                  Add card
                </button>
              </div>
            </form>

            <h3>Import from CSV</h3>
            <div className="panel">
              <div className="row csv-row">
                <button
                  type="button"
                  id="pick"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  Choose CSV file
                </button>
                <span className="hint csv-target-hint">
                  Cards go into ‘{selectedItem.name}’.
                </span>
              </div>
              <p className="hint">
                Columns: front, back
                {selectedItem.isSubdeck
                  ? ''
                  : ', and an optional third column with a subdeck name such as '}
                {!selectedItem.isSubdeck && <code>Past tense</code>}
                {!selectedItem.isSubdeck && ', created if missing'}. A header row
                is detected automatically.
              </p>
            </div>

            <h3>Cards</h3>
            {displayedCards.length ? (
              displayedCards.map((card) => (
                <div className="card" key={card.id}>
                  <div className="f">
                    {getCardSideText(card, 'front') || 'Image card'}
                  </div>
                  <div className="b">
                    {getCardSideText(card, 'back') || 'Image card'}
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="link"
                      disabled={saving}
                      onClick={() => handleEditCard(card)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link del"
                      disabled={saving}
                      onClick={() => handleDeleteCard(card.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">No cards in this deck yet.</div>
            )}
          </>
        )}
      </main>

      <input
        ref={fileInputRef}
        type="file"
        id="file"
        accept=".csv,text/csv"
        hidden
        onChange={handleImportCSV}
      />

      <div
        className={`toast${toast.visible ? ' show' : ''}`}
        id="toast"
        role="status"
      >
        {toast.message}
      </div>

      {dialog && (
        <ModalDialog config={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}