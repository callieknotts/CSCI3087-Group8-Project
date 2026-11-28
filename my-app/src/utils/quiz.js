import { shuffle } from './shuffle';

// Quiz mode: multiple choice. The question is a card's front, the right answer is its back,
// and the three wrong answers are the backs of other cards picked at random.

export const QUIZ_MIN_CARDS = 4; // one right answer + three wrong ones
export const QUIZ_CHOICES = 4;

const clean = (text) => (typeof text === 'string' ? text.trim() : '');

// Only cards with TEXT on both sides can be asked (an image-only side can't be shown yet).
export function quizzableCards(cards) {
  return cards.filter(
    (card) => clean(card.content?.front?.text) && clean(card.content?.back?.text),
  );
}

// Quiz mode needs at least 4 cards whose answers are all different from each other,
// otherwise there are not enough different wrong answers to fill the choices.
export function canQuiz(cards) {
  const answers = new Set(quizzableCards(cards).map((card) => clean(card.content.back.text).toLowerCase()));
  return answers.size >= QUIZ_MIN_CARDS;
}

// One question per card, in random order. Each is { card, question, answer, choices }, where
// choices is the right answer and 3 wrong ones in random order. A wrong answer never repeats
// the right one (two cards can have the same back) and never repeats another wrong answer.
// `asked` limits which cards get a question (for "retry the ones I missed"); the wrong answers
// still come from all of `cards`.
export function buildQuiz(cards, random = Math.random, asked = cards) {
  const usable = quizzableCards(cards);
  return shuffle(quizzableCards(asked), random).map((card) => {
    const answer = clean(card.content.back.text);
    const taken = new Set([answer.toLowerCase()]);
    const wrong = [];
    for (const other of shuffle(usable, random)) {
      const text = clean(other.content.back.text);
      if (taken.has(text.toLowerCase())) continue;
      taken.add(text.toLowerCase());
      wrong.push(text);
      if (wrong.length === QUIZ_CHOICES - 1) break;
    }
    return {
      card,
      question: clean(card.content.front.text),
      answer,
      choices: shuffle([answer, ...wrong], random),
    };
  });
}
