import { ApiError, getDeck, getSubdeck, listCards, listDecks } from '../api/decksApi';
import { paths } from '../routes';
import { loadStarred } from './starredCards';

// Gets the cards to study, a title, and where the "back" link goes. There are three kinds:
//   /decks/:deckId/flashcards                  every card in the deck (all its subdecks)
//   /decks/:deckId/subdecks/:sid/flashcards    only that subdeck's cards
//   /flashcards/starred                        every card the user starred, from all decks
export async function loadFlashcardSet(deckId, subdeckId, userId) {
  // starred cards: look through every deck and keep only the starred ones
  if (!deckId) {
    const starred = loadStarred(userId);
    const decks = await listDecks();
    const lists = await Promise.all(decks.map((deck) => listCards(deck.id)));
    return {
      title: 'Starred cards',
      backTo: paths.home,
      backLabel: 'Library',
      cards: lists.flat().filter((card) => starred.has(card.id)),
    };
  }

  // one subdeck. The backend answers a missing subdeck with a 500, so say "not found" instead.
  if (subdeckId) {
    const [subdeck, cards] = await Promise.all([
      getSubdeck(deckId, subdeckId).catch((err) => {
        if (err.status === 500) throw new ApiError(404, 'That subdeck could not be found.');
        throw err;
      }),
      listCards(deckId, subdeckId),
    ]);
    return {
      title: subdeck.subdeckname,
      backTo: paths.subdeck(deckId, subdeckId),
      backLabel: 'Subdeck',
      cards,
    };
  }

  // a whole deck: the backend returns the cards of every subdeck, or just the deck's own
  // cards when it has no subdecks, so one request covers both cases
  const [deck, cards] = await Promise.all([getDeck(deckId), listCards(deckId)]);
  if (!deck) throw new ApiError(404, 'That deck could not be found.');
  return { title: deck.deckname, backTo: paths.deck(deckId), backLabel: 'Deck', cards };
}
