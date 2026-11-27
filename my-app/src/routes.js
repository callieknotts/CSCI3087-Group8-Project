// Every page address in one place, so the header, the library and the pages that
// other teammates build all link to the same paths.
// `show` ('new' | 'learn' | 'due') is optional: it makes a Repetition session study only that kind
// of card (the New / Learn / Due numbers in the library link to it)
const showQuery = (show) => (show ? `?show=${show}` : '');

export const paths = {
  home: '/',
  manage: '/manage', // the "+" page: create / edit decks, subdecks and cards
  profile: '/profile',
  search: '/search', // /search?q=text
  deck: (deckId) => `/decks/${deckId}`,
  subdeck: (deckId, subdeckId) => `/decks/${deckId}/subdecks/${subdeckId}`,
  // flashcard mode: a whole deck (all its subdecks), one subdeck, or every starred card
  deckFlashcards: (deckId) => `/decks/${deckId}/flashcards`,
  subdeckFlashcards: (deckId, subdeckId) => `/decks/${deckId}/subdecks/${subdeckId}/flashcards`,
  starredFlashcards: '/flashcards/starred',
  // repetition mode (spaced repetition): a whole deck or one subdeck
  deckRepetition: (deckId, show) => `/decks/${deckId}/repetition${showQuery(show)}`,
  subdeckRepetition: (deckId, subdeckId, show) =>
    `/decks/${deckId}/subdecks/${subdeckId}/repetition${showQuery(show)}`,
};
