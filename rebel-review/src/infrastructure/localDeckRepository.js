/* AI GENERATED CODE: this is the local storage repository 
that allows the react app to run without a backend
*/

const STORAGE_KEY = 'rebelreview_decks';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeAll(decks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export const localDeckRepository = {
  async save(deck) {        //async must be used if other functions are awaiting (await)
    const decks = readAll();
    const savedDeck = {
      ...deck,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    writeAll([...decks, savedDeck]);
    return savedDeck;
  },

  async getAll() {
    return readAll();
  },
};