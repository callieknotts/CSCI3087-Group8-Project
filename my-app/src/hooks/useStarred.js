import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { starCard, unstarCard } from '../api/decksApi';

// A copy of the set with one card id added or removed.
function withCard(ids, cardId, on) {
  const next = new Set(ids);
  if (on) next.add(cardId);
  else next.delete(cardId);
  return next;
}

// The star state of a page that shows cards, starting from the ids the page loaded.
// toggle(card) flips the star straight away and tells the backend; if the backend says no,
// the star goes back and `error` says why. An expired session (401) sends the person to login.
// Returns { starred (a Set of card ids), toggle, error }.
export function useStarred(initialIds) {
  const { onUnauthorized } = useOutletContext();
  const [starred, setStarred] = useState(() => new Set(initialIds));
  const [error, setError] = useState('');

  const toggle = useCallback(
    async (card) => {
      const turnOn = !starred.has(card.id);
      setError('');
      setStarred((current) => withCard(current, card.id, turnOn));

      try {
        await (turnOn ? starCard(card.id) : unstarCard(card.id));
      } catch (err) {
        setStarred((current) => withCard(current, card.id, !turnOn)); // undo
        if (err.status === 401) onUnauthorized();
        else setError(err.message);
      }
    },
    [starred, onUnauthorized],
  );

  return { starred, toggle, error };
}
