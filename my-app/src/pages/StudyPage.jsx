import { useEffect, useRef, useState } from 'react';
import Button from '../components/Button';
import Flashcard from '../components/Flashcard';
import './LoginPage.css';
import './StudyPage.css';

// Placeholder cards until the backend has card endpoints.
const SAMPLE_CARDS = [
  { id: 1, front: 'What does HTTP stand for?', back: 'HyperText Transfer Protocol' },
  { id: 2, front: 'What does CSS stand for?', back: 'Cascading Style Sheets' },
  { id: 3, front: 'What hook stores state in a React component?', back: 'useState' },
  { id: 4, front: 'What does an API do?', back: 'Lets two programs talk to each other' },
  { id: 5, front: 'What is a primary key?', back: 'A column that uniquely identifies each row in a table' },
];

function shuffled(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Splits CSV text into rows of cells. Handles "quoted, cells", "" escaped quotes,
// and line breaks inside quotes.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const HEADER_WORDS = new Set(['front', 'back', 'question', 'answer', 'term', 'definition']);

// First column = front, second column = back. A header row is skipped if present.
export function cardsFromCsv(text) {
  const clean = text.replace(/^\uFEFF/, ''); // strip Excel's BOM
  let rows = parseCsv(clean).filter((r) => r.some((c) => c.trim() !== ''));

  if (rows.length > 0 && rows[0].every((c) => HEADER_WORDS.has(c.trim().toLowerCase()))) {
    rows = rows.slice(1);
  }

  const cards = [];
  for (const r of rows) {
    const front = (r[0] ?? '').trim();
    const back = (r[1] ?? '').trim();
    if (front && back) cards.push({ id: cards.length + 1, front, back });
  }
  return { cards, skipped: rows.length - cards.length };
}

export default function StudyPage({ cards = SAMPLE_CARDS, title = 'Study' }) {
  const [baseCards, setBaseCards] = useState(cards); // original order, used by Restart
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [shuffleNote, setShuffleNote] = useState('');
  const fileInput = useRef(null);

  const total = deck.length;
  const card = deck[index];

  function goTo(nextIndex) {
    setFlipped(false);
    setShuffleNote('');
    setIndex(nextIndex);
  }

  const goNext = () => goTo(Math.min(index + 1, total - 1));
  const goPrev = () => goTo(Math.max(index - 1, 0));
  const flip = () => setFlipped((f) => !f);

  // Shuffles the whole deck but keeps your position number, so "Card 3 of 5"
  // stays 3 of 5 with a different card in it. The current card is guaranteed
  // to change (as long as the deck has 2+ cards).
  function handleShuffle() {
    if (total < 2) return;
    const next = shuffled(deck);
    if (next[index] === deck[index]) {
      const other = (index + 1) % total;
      [next[index], next[other]] = [next[other], next[index]];
    }
    setDeck(next);
    setFlipped(false);
    setShuffleNote('Deck shuffled.');
  }

  function handleRestart() {
    setDeck(baseCards);
    goTo(0);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again later
    if (!file) return;

    setUploadMessage('');
    setUploadError('');

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Please choose a .csv file.');
      return;
    }

    try {
      const { cards: loaded, skipped } = cardsFromCsv(await file.text());
      if (loaded.length === 0) {
        setUploadError('No cards found. Each row needs a front and a back, like: question,answer');
        return;
      }
      setBaseCards(loaded);
      setDeck(loaded);
      goTo(0);
      setUploadMessage(
        `Loaded ${loaded.length} card${loaded.length === 1 ? '' : 's'} from ${file.name}` +
          (skipped > 0 ? ` (${skipped} row${skipped === 1 ? '' : 's'} skipped)` : '') +
          '.'
      );
    } catch {
      setUploadError('Could not read that file. Try again.');
    }
  }

  // Keyboard: ← → to move, Space is handled by the card button itself.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const upload = (
    <div className="study__upload">
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="study__file-input"
        aria-label="Upload CSV file"
      />
      <Button variant="type2" onClick={() => fileInput.current?.click()}>
        Upload CSV
      </Button>
      <p className="study__hint">CSV format: one card per row, front in column 1, back in column 2.</p>
      {uploadMessage && <p className="study__status" role="status">{uploadMessage}</p>}
      {uploadError && <p className="form-error" role="alert">{uploadError}</p>}
    </div>
  );

  if (total === 0) {
    return (
      <main className="login-page">
        <div className="study">
          <h1>{title}</h1>
          <p>This deck has no cards yet.</p>
          {upload}
          <a href="/" className="link-button">Back to home</a>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page study-page">
      <div className="study">
        <header className="study__header">
          <h1>{title}</h1>
          <p className="study__counter" aria-live="polite">
            Card {index + 1} of {total}
          </p>
        </header>

        <div
          className="study__progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div className="study__progress-bar" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>

        <Flashcard front={card.front} back={card.back} flipped={flipped} onFlip={flip} />

        <div className="study__controls">
          <Button variant="type2" onClick={goPrev} disabled={index === 0}>
            ← Previous
          </Button>
          <Button onClick={flip}>Flip</Button>
          <Button variant="type2" onClick={goNext} disabled={index === total - 1}>
            Next →
          </Button>
        </div>

        <div className="study__controls study__controls--secondary">
          <Button variant="type2" onClick={handleShuffle} disabled={total < 2}>
            Shuffle
          </Button>
          <Button variant="type2" onClick={handleRestart}>Restart</Button>
        </div>

        {shuffleNote && <p className="study__status" role="status">{shuffleNote}</p>}

        {upload}

        <p className="study__hint">Tip: click the card or press Space to flip, use ← → to move.</p>
        <a href="/" className="link-button study__home-link">Back to home</a>
      </div>
    </main>
  );
}
