// Every page address in one place, so the header, the library and the pages that
// other teammates build all link to the same paths.
export const paths = {
  // fixed addresses
  home: '/',
  manage: '/manage', // the "+" page: create / edit decks, subdecks and cards
  profile: '/profile',
  search: '/search', // /search?q=text
  // addresses that include an id: these build the address for a specific deck or subdeck
  deck: (deckId) => `/decks/${deckId}`,
  subdeck: (deckId, subdeckId) => `/decks/${deckId}/subdecks/${subdeckId}`,
};
