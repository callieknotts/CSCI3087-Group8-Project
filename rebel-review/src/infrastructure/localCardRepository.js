/* AI GENERATED CODE: this is the local storage repository 
that allows the react app to run without a backend
*/

// src/infrastructure/localCardRepository.js
// Temporary stand-in for a real backend. Replace with an API-backed repository later
// that exports the same methods (save, getByDeckId).

const STORAGE_KEY = 'rebelreview_cards';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeAll(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export const localCardRepository = {
  async save(card) {
    const cards = readAll();
    const savedCard = {
      ...card,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    writeAll([...cards, savedCard]);
    return savedCard;
  },

  async getByDeckId(deckId) {
    return readAll().filter((card) => card.deck_id === deckId);
  },
};