import {test, expect} from 'vitest';
import {shuffle, reshuffle} from '../../my-app/src/utils/shuffle';
import {buildQuiz, canQuiz, quizzableCards} from '../../my-app/src/utils/quiz';
import {buildSides, spreadPairs} from '../../my-app/src/utils/frontBack';
import {checkAnswer, isSingleWord, typeableCards} from '../../my-app/src/utils/typeIt';

// a card the way the backend sends it
function card(id, front, back) {
    return {id, content: {front: {text: front, image_key: null}, back: {text: back, image_key: null}}};
}

// ---------- shuffle ----------

test('shuffle keeps every card exactly once and does not change the original list', () => {
    const original = [1, 2, 3, 4, 5, 6];
    const result = shuffle(original);
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    expect(original).toEqual([1, 2, 3, 4, 5, 6]);
});

test('shuffle gives every order about equally often (it is not biased)', () => {
    const counts = {};
    for (let i = 0; i < 6000; i++) {
        const key = shuffle([1, 2, 3]).join('');
        counts[key] = (counts[key] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(6); // all 6 orders happen
    for (const count of Object.values(counts)) expect(count).toBeGreaterThan(800); // 1000 expected each
});

test('reshuffle never gives back the same order when there is more than one card', () => {
    // a "random" that always picks the last spot would leave the order unchanged with plain shuffle
    const stuck = () => 0.999999;
    const result = reshuffle([1, 2, 3], stuck);
    expect(result).not.toEqual([1, 2, 3]);
    expect([...result].sort()).toEqual([1, 2, 3]);
    expect(reshuffle([1])).toEqual([1]);
    expect(reshuffle([])).toEqual([]);
});

// ---------- quiz ----------

const FIVE = [card('1', 'a', 'A'), card('2', 'b', 'B'), card('3', 'c', 'C'), card('4', 'd', 'D'), card('5', 'e', 'E')];

test('quiz needs at least 4 cards with different answers', () => {
    expect(canQuiz(FIVE)).toBe(true);
    expect(canQuiz(FIVE.slice(0, 4))).toBe(true);
    expect(canQuiz(FIVE.slice(0, 3))).toBe(false);
    // 4 cards but the same answer on all of them: not enough different wrong answers
    expect(canQuiz([card('1', 'a', 'x'), card('2', 'b', 'x'), card('3', 'c', 'x'), card('4', 'd', 'x')])).toBe(false);
});

test('quiz leaves out cards with an empty or image-only side', () => {
    const image = {id: '9', content: {front: {text: 'pic', image_key: null}, back: {text: null, image_key: 'k'}}};
    expect(quizzableCards([...FIVE, image, card('10', '', 'x')])).toHaveLength(5);
});

test('every quiz question has 4 different choices, one of them the right answer', () => {
    const questions = buildQuiz(FIVE);
    expect(questions).toHaveLength(5);
    expect(new Set(questions.map((q) => q.card.id)).size).toBe(5); // each card asked once
    for (const q of questions) {
        expect(q.choices).toHaveLength(4);
        expect(new Set(q.choices).size).toBe(4);
        expect(q.choices).toContain(q.answer);
        expect(q.answer).toBe(q.card.content.back.text);
    }
});

test('a wrong choice never repeats the right answer, even when two cards share a back', () => {
    const cards = [...FIVE, card('6', 'f', 'a')]; // same back as card 1, just a different case
    for (let i = 0; i < 50; i++) {
        for (const q of buildQuiz(cards)) {
            expect(new Set(q.choices.map((c) => c.toLowerCase())).size).toBe(4);
        }
    }
});

test('buildQuiz can ask only some cards (retry the missed ones) with wrong answers from all of them', () => {
    const questions = buildQuiz(FIVE, Math.random, [FIVE[0]]);
    expect(questions).toHaveLength(1);
    expect(questions[0].choices).toHaveLength(4);
});

// ---------- type it out ----------

test('isSingleWord', () => {
    expect(isSingleWord('mitosis')).toBe(true);
    expect(isSingleWord('  mitosis  ')).toBe(true);
    expect(isSingleWord('cell division')).toBe(false);
    expect(isSingleWord('')).toBe(false);
    expect(isSingleWord(null)).toBe(false);
});

test('type it out only keeps cards whose back is one word', () => {
    const kept = typeableCards([card('1', 'a', 'one'), card('2', 'b', 'two words'), card('3', '', 'x')]);
    expect(kept.map((c) => c.id)).toEqual(['1']);
});

test('checkAnswer ignores capitals, spaces and punctuation around the word', () => {
    expect(checkAnswer('Mitosis', 'mitosis')).toBe('correct');
    expect(checkAnswer('  mitosis. ', 'Mitosis')).toBe('correct');
    expect(checkAnswer('mitosi', 'mitosis')).toBe('wrong');
    expect(checkAnswer('', 'mitosis')).toBe('wrong');
});

test('checkAnswer tells the right word with the wrong accents apart', () => {
    expect(checkAnswer('cafe', 'café')).toBe('accent');
    expect(checkAnswer('café', 'café')).toBe('correct');
});

// ---------- front & back ----------

test('front & back asks every card twice: all front-first, then all back-first', () => {
    const sides = buildSides(FIVE.slice(0, 3));
    expect(sides.map((s) => `${s.card.id}:${s.side}`)).toEqual(['1:front', '2:front', '3:front', '1:back', '2:back', '3:back']);
    expect(new Set(sides.map((s) => s.key)).size).toBe(6);
});

test('spreadPairs keeps the two questions about one card apart', () => {
    const sides = buildSides(FIVE);
    const bunched = [sides[0], sides[5], sides[1], sides[6], sides[2], sides[7], sides[3], sides[8], sides[4], sides[9]];
    const result = spreadPairs(bunched);
    expect(result).toHaveLength(10);
    for (let i = 1; i < result.length; i++) expect(result[i].card.id).not.toBe(result[i - 1].card.id);
    expect(new Set(result.map((s) => s.key)).size).toBe(10);
});
