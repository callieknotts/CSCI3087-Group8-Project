import { useCallback, useState } from 'react';
import { reshuffle, shuffle } from '../utils/shuffle';

// The order the cards are studied in, for every mode that has a "Shuffle" button.
// `cards` is the original order. Returns:
//   order       the cards in the order to study them
//   shuffled    true after the person pressed Shuffle (false = original order)
//   round       goes up by one on every shuffle / reset, so a page can start over: <Run key={round} />
//   shuffleNow  shuffle the cards again (the order always changes)
//   reset       go back to the original order
// startShuffled: begin already shuffled (Quiz mode does this)
// arrange: optional function that tidies a shuffled list (Front & back uses it to keep the two
//          questions about one card apart)
export function useCardOrder(cards, { startShuffled = false, arrange = (list) => list } = {}) {
  const [shuffled, setShuffled] = useState(startShuffled);
  const [order, setOrder] = useState(() => (startShuffled ? arrange(shuffle(cards)) : cards));
  const [round, setRound] = useState(0);

  const shuffleNow = useCallback(() => {
    setOrder((current) => arrange(reshuffle(current)));
    setShuffled(true);
    setRound((n) => n + 1);
  }, [arrange]);

  const reset = useCallback(() => {
    setOrder(cards);
    setShuffled(false);
    setRound((n) => n + 1);
  }, [cards]);

  return { order, shuffled, round, shuffleNow, reset };
}
