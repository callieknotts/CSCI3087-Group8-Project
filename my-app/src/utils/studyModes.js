// the study modes in the "Mode" dropdown on a deck page and a subdeck page.
// Add a new mode here and it shows up in both dropdowns.
//   classicTo: the page for Classic mode (the flashcards) for that deck or subdeck
// A mode with `disabled: true` is only a placeholder (it is shown but can't be picked yet).
export function studyModes(classicTo, repetitionTo) {
  return [
    { label: 'Classic', to: classicTo },
    { label: 'Repetition', to: repetitionTo },
    { label: 'Quiz', disabled: true, note: 'Coming soon'},
  ];
}
