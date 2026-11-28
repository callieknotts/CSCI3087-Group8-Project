import { paths } from '../routes';

// the study modes in the "Mode" dropdown on a deck page and a subdeck page.
// Add a new mode here and it shows up in both dropdowns.
// Pass the deck id, and the subdeck id too for a subdeck page.
// A mode with `disabled: true` is only a placeholder (it is shown but can't be picked yet).
export function studyModes(deckId, subdeckId) {
  const to = (forDeck, forSubdeck) => (subdeckId ? forSubdeck(deckId, subdeckId) : forDeck(deckId));
  return [
    { label: 'Classic', to: to(paths.deckFlashcards, paths.subdeckFlashcards) },
    { label: 'Repetition', to: to(paths.deckRepetition, paths.subdeckRepetition) },
    { label: 'Quiz', to: to(paths.deckQuiz, paths.subdeckQuiz) },
    { label: 'Type it out', to: to(paths.deckTypeIt, paths.subdeckTypeIt) },
    { label: 'Front & back', to: to(paths.deckFrontBack, paths.subdeckFrontBack) },
  ];
}

// The same modes for "all my starred cards" (the Starred page's "Review mode" dropdown)
export function starredStudyModes() {
  return [
    { label: 'Classic', to: paths.starredFlashcards },
    { label: 'Repetition', to: paths.starredRepetition },
    { label: 'Quiz', to: paths.starredQuiz },
    { label: 'Type it out', to: paths.starredTypeIt },
    { label: 'Front & back', to: paths.starredFrontBack },
  ];
}
