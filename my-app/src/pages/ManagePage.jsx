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

export default function ManagePage() {
  const { onUnauthorized } = useOutletContext();
  const onUnauthorizedRef = useRef(onUnauthorized);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [decks, setDecks] = useState([]);
  const [subdecksByDeck, setSubdecksByDeck] = useState({});
  const [cardsByDeck, setCardsByDeck] = useState({});
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [openDecks, setOpenDecks] = useState({});

  const [newDeckName, setNewDeckName] = useState('');
  const [subdeckName, setSubdeckName] = useState('');
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState(null);
  const [dialogValues, setDialogValues] = useState([]);

  useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized;
  }, [onUnauthorized]);

  useEffect(() => {
    return () => {
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!dialogConfig) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setDialogConfig(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialogConfig]);

  function showToast(msg) {
    setToastMessage(msg);
    setToastVisible(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
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

  function openDialog(config) {
    setDialogValues((config.fields || []).map((f) => f.value || ''));
    setDialogConfig(config);
  }

  async function loadDeckTreeAndCards(preferredDeckId = null) {
    setLoading(true);
    try {
      const deckList = await listDecks();
      setDecks(deckList);

      const subEntries = await Promise.all(
        deckList.map(async (d) => [d.id, await listSubdecks(d.id)]),
      );
      const subMap = Object.fromEntries(subEntries);
      setSubdecksByDeck(subMap);

      const cardEntries = await Promise.all(
        deckList.map(async (d) => {
          const deckCards = await listCards(d.id, null);
          const subs = subMap[d.id] || [];
          const subCardsLists = await Promise.all(
            subs.map((s) => listCards(d.id, s.id)),
          );
          return [d.id, [...deckCards, ...subCardsLists.flat()]];
        }),
      );
      setCardsByDeck(Object.fromEntries(cardEntries));

      setSelectedDeckId((current) => {
        if (preferredDeckId) return preferredDeckId;
        const allIds = [
          ...deckList.map((d) => d.id),
          ...Object.values(subMap)
            .flat()
            .map((s) => s.id),
        ];
        if (current && allIds.includes(current)) return current;
        return deckList[0]?.id ?? '';
      });
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeckTreeAndCards();
  }, []);

  // Build unified lookup for root decks and subdecks.
  const subdeckToParent = {};
  const subdecksByParent = {};
  for (const d of decks) {
    subdecksByParent[d.id] = subdecksByDeck[d.id] || [];
    for (const s of subdecksByDeck[d.id] || []) {
      subdeckToParent[s.id] = d.id;
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
        raw: rootDeck,
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
          raw: sub,
        };
      }
    }
    return null;
  }

  function getSubdecksOf(id) {
    if (!id || subdeckToParent[id]) return [];
    return (subdecksByDeck[id] || []).map((s) => ({
      id: s.id,
      name: s.subdeckname,
      parentId: id,
      isSubdeck: true,
      raw: s,
    }));
  }

  function getCardCount(id) {
    if (!id) return 0;
    if (subdeckToParent[id]) {
      const parentId = subdeckToParent[id];
      return (cardsByDeck[parentId] || []).filter(
        (c) => (c.subdeck_id ?? c.subdeckId ?? null) === id,
      ).length;
    }
    return (cardsByDeck[id] || []).length;
  }

  async function handleCreateDeck(e) {
    e.preventDefault();
    const trimmed = newDeckName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await createDeck(trimmed, null);
      setNewDeckName('');
      await loadDeckTreeAndCards(created.id);
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
      await loadDeckTreeAndCards(created.id);
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

    openDialog({
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
          await loadDeckTreeAndCards(item.id);
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
    const cnt = getCardCount(item.id);

    openDialog({
      title: item.isSubdeck ? 'Delete subdeck?' : 'Delete deck?',
      message: `This deletes '${item.name}'${
        !item.isSubdeck && subs.length > 0 ? ', its subdecks,' : ''
      } and ${cnt} card${cnt === 1 ? '' : 's'}. This can’t be undone.`,
      ok: 'Delete',
      danger: true,
      onSubmit: async () => {
        setSaving(true);
        try {
          if (item.isSubdeck) {
            await deleteSubdeck(item.parentId, item.id);
            await loadDeckTreeAndCards(item.parentId);
          } else {
            await deleteDeck(item.id);
            await loadDeckTreeAndCards(null);
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
    const existingCount = (cardsByDeck[rootDeckId] || []).length;

    setSaving(true);
    try {
      await createCard(rootDeckId, {
        front_text: front,
        back_text: back,
        front_image: null,
        back_image: null,
        position: existingCount,
        subdeck_id: subdeckId,
      });
      setFrontText('');
      setBackText('');
      await loadDeckTreeAndCards(item.id);
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
    const currentFront = getCardSideText(card, 'front');
    const currentBack = getCardSideText(card, 'back');

    openDialog({
      title: 'Edit card',
      fields: [
        { label: 'Front', value: currentFront, multiline: true },
        { label: 'Back', value: currentBack, multiline: true },
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
          await loadDeckTreeAndCards(item.id);
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
      await loadDeckTreeAndCards(item.id);
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
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) {
        showToast('That file has no rows');
        return;
      }

      const rootDeckId = item.isSubdeck ? item.parentId : item.id;
      const currentSubs = [...(subdecksByDeck[rootDeckId] || [])];
      let positionBase = (cardsByDeck[rootDeckId] || []).length;
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

        await createCard(rootDeckId, {
          front_text: fr,
          back_text: bk,
          front_image: null,
          back_image: null,
          position: positionBase + imported,
          subdeck_id: targetSubdeckId,
        });
        imported += 1;
      }

      if (!item.isSubdeck) {
        setOpenDecks((prev) => ({ ...prev, [rootDeckId]: true }));
      }
      await loadDeckTreeAndCards(item.id);
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

  function renderTreeNodes(parentId = null) {
    if (parentId !== null) {
      const subs = getSubdecksOf(parentId);
      if (!subs.length) return null;
      return (
        <ul>
          {subs.map((s) => (
            <li key={s.id}>
              <div
                className={`node${selectedDeckId === s.id ? ' sel' : ''}`}
                onClick={() => setSelectedDeckId(s.id)}
              >
                <span className="caret" />
                <span className="name">{s.name}</span>
                <span className="count">{getCardCount(s.id)}</span>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    if (!decks.length) {
      return <p className="hint">No decks yet. Add one above.</p>;
    }

    return (
      <ul>
        {decks.map((d) => {
          const subs = getSubdecksOf(d.id);
          const hasKids = subs.length > 0;
          const isOpen = !!openDecks[d.id];
          return (
            <li key={d.id}>
              <div
                className={`node${selectedDeckId === d.id ? ' sel' : ''}`}
                onClick={() => setSelectedDeckId(d.id)}
              >
                <span
                  className="caret"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDecks((prev) => ({ ...prev, [d.id]: !prev[d.id] }));
                  }}
                >
                  {hasKids ? (isOpen ? '▾' : '▸') : ''}
                </span>
                <span className="name">{d.deckname}</span>
                <span className="count">{getCardCount(d.id)}</span>
                <button
                  type="button"
                  className="link add"
                  title="Add subdeck"
                  aria-label={`Add subdeck to ${d.deckname}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDialog({
                      title: 'New subdeck',
                      fields: [{ label: 'Name' }],
                      ok: 'Add subdeck',
                      onSubmit: ([name]) => handleAddSubdeck(d.id, name),
                    });
                  }}
                >
                  +
                </button>
              </div>
              {hasKids && isOpen && renderTreeNodes(d.id)}
            </li>
          );
        })}
      </ul>
    );
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
      ? (cardsByDeck[selectedItem.parentId] || []).filter(
          (c) => (c.subdeck_id ?? c.subdeckId ?? null) === selectedItem.id,
        )
      : cardsByDeck[selectedItem.id] || []
    : [];
  const totalInSelection = selectedItem ? getCardCount(selectedItem.id) : 0;

  return (
    <div className="app manage-page">
      <aside>
        <h1>Decks</h1>
        <form
          id="newDeck"
          className="row"
          style={{ marginBottom: '14px' }}
          onSubmit={handleCreateDeck}
        >
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
          {loading ? <p className="hint">Loading decks…</p> : renderTreeNodes(null)}
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
                  onClick={() => {
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

            <div
              className="row"
              style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}
            >
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
                    {subdecks.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        className="sub"
                        onClick={() => {
                          setSelectedDeckId(s.id);
                          setOpenDecks((prev) => ({
                            ...prev,
                            [selectedItem.id]: true,
                          }));
                        }}
                      >
                        {s.name} <span className="count">{getCardCount(s.id)}</span>
                      </button>
                    ))}
                  </div>
                )}
                <form
                  id="subForm"
                  className="row"
                  style={{ maxWidth: '420px', marginTop: '6px' }}
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
            <p className="hint" style={{ margin: '0 0 10px' }}>
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
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="pick"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  Choose CSV file
                </button>
                <span className="hint" style={{ margin: 0 }}>
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
              displayedCards.map((c) => (
                <div className="card" key={c.id}>
                  <div className="f">
                    {getCardSideText(c, 'front') || 'Image card'}
                  </div>
                  <div className="b">
                    {getCardSideText(c, 'back') || 'Image card'}
                  </div>
                  <div className="row">
                    <button
                      type="button"
                      className="link"
                      disabled={saving}
                      onClick={() => handleEditCard(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link del"
                      disabled={saving}
                      onClick={() => handleDeleteCard(c.id)}
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
        className={`toast${toastVisible ? ' show' : ''}`}
        id="toast"
        role="status"
      >
        {toastMessage}
      </div>

      {dialogConfig && (
        <div
          className="ov"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDialogConfig(null);
          }}
        >
          <form
            className="dlg"
            role="dialog"
            aria-modal="true"
            onSubmit={async (e) => {
              e.preventDefault();
              const vals = [...dialogValues];
              const submitFn = dialogConfig.onSubmit;
              setDialogConfig(null);
              await submitFn?.(vals);
            }}
          >
            <h2>{dialogConfig.title}</h2>
            {dialogConfig.message && <p>{dialogConfig.message}</p>}
            {(dialogConfig.fields || []).map((f, i) => (
              <label key={f.label}>
                {f.label}
                {f.multiline ? (
                  <textarea
                    value={dialogValues[i] ?? ''}
                    onChange={(e) => {
                      const next = [...dialogValues];
                      next[i] = e.target.value;
                      setDialogValues(next);
                    }}
                  />
                ) : (
                  <input
                    value={dialogValues[i] ?? ''}
                    onChange={(e) => {
                      const next = [...dialogValues];
                      next[i] = e.target.value;
                      setDialogValues(next);
                    }}
                  />
                )}
              </label>
            ))}
            <div className="btns">
              <button
                type="button"
                onClick={() => setDialogConfig(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={dialogConfig.danger ? 'danger' : 'primary'}
              >
                {dialogConfig.ok || 'OK'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}