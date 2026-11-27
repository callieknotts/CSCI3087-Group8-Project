// Every page address in one place, so the header, the library and the pages that
// other teammates build all link to the same paths.
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
  deckRepetition: (deckId) => `/decks/${deckId}/repetition`,
  subdeckRepetition: (deckId, subdeckId) => `/decks/${deckId}/subdecks/${subdeckId}/repetition`,
};
