/* AI GENERATED CODE: this is the local storage repository 
that allows the react app to run without a backend
*/

// src/infrastructure/localCardRepository.js
// Temporary stand-in for a real backend. Replace with an API-backed repository later
// that exports the same methods (save, getByDeckId, update, delete).

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

  async update(card) {
    const cards = readAll();
    const existing = cards.find((c) => c.id === card.id);
    if (!existing) {
      throw new Error('Card not found.');
    }
    // id, deck and creation time always come from the stored card, so an update can never move a card.
    const updatedCard = {
      ...card,
      id: existing.id,
      deck_id: existing.deck_id,
      created_at: existing.created_at,
    };
    writeAll(cards.map((c) => (c.id === card.id ? updatedCard : c)));
    return updatedCard;
  },

  async delete(cardId) {
    const cards = readAll();
    if (!cards.some((c) => c.id === cardId)) {
      throw new Error('Card not found.');
    }
    writeAll(cards.filter((c) => c.id !== cardId));
    return cardId;
  },
};