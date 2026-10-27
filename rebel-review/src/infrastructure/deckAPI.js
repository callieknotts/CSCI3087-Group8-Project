// update when we have backend
const API = '<enter API name>';

export const deckRepository = {
  async save(deck) {
    const res = await fetch(`${API}/decks`, { //fetch is the get request
      method: 'POST',                         //Post returns a JSON object to use on the frontend 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deck),           //converts JS value to JSON 
    });

    if (!res.ok) {
      throw new Error('Failed to create deck.');
    }
    return res.json(); //returns the decks object
  },
};