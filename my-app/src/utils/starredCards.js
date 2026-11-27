// Starred cards.
// PSEUDO: the backend has no way to star a card yet, so the starred card ids are kept in
// this browser (localStorage), separately for each logged-in user. They are lost if the
// browser data is cleared and are not shared between devices.
// TODO: replace these two functions with backend calls when starring exists there.

function storageKey(userId) {
  return `rebelreview:starred:${userId ?? 'guest'}`;
}

// The set of starred card ids for this user.
export function loadStarred(userId) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]');
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set(); // storage blocked or unreadable: start with nothing starred
  }
}

export function saveStarred(userId, starredIds) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify([...starredIds]));
  } catch {
    // storage blocked: the star still shows on this page, it just will not be remembered
  }
}
