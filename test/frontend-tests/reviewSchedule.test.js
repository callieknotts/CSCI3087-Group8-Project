import {test, expect} from 'vitest';
import {
    buildQueue,
    cardKind,
    filterByShow,
    formatInterval,
    nextDueText,
} from '../../my-app/src/utils/reviewSchedule';

const DAY = 86_400_000;

// a review state the way the backend sends it
function state(intervalDays, dueInDays, repetitions = 2) {
    return {
        repetitions,
        ease_factor: 2.5,
        interval_days: intervalDays,
        due_at: new Date(Date.now() + dueInDays * DAY).toISOString(),
    };
}

test('Intervals are written in minutes, hours, days or months', () => {
    expect(formatInterval(10 / 1440)).toBe('10m');
    expect(formatInterval(0.5)).toBe('12h');
    expect(formatInterval(0.9999)).toBe('1d');
    expect(formatInterval(7.5)).toBe('8d');
    expect(formatInterval(45)).toBe('1.5mo');
});

test('A card is new, learning (under a day) or in review', () => {
    expect(cardKind(undefined)).toBe('new');
    expect(cardKind(state(10 / 1440, 0))).toBe('learn');
    expect(cardKind(state(3, 0))).toBe('review');
});

test('The queue has due cards first (earliest first), then new cards, and skips cards due later', () => {
    const cards = [{id: 'new1'}, {id: 'later'}, {id: 'late'}, {id: 'earlier'}, {id: 'new2'}];
    const states = new Map([
        ['later', state(3, 2)],
        ['late', state(1, -1)],
        ['earlier', state(1, -3)],
    ]);
    expect(buildQueue(cards, states).map((c) => c.id)).toEqual(['earlier', 'late', 'new1', 'new2']);
});

test('Only the first few new cards are queued', () => {
    const cards = [{id: 'a'}, {id: 'b'}, {id: 'c'}];
    expect(buildQueue(cards, new Map(), Date.now(), 2).map((c) => c.id)).toEqual(['a', 'b']);
});

test('A time with no zone is read as UTC', () => {
    const now = Date.parse('2026-11-27T12:00:00Z');
    const states = new Map([['a', {interval_days: 1, due_at: '2026-11-27T11:00:00'}]]);
    expect(buildQueue([{id: 'a'}], states, now)).toHaveLength(1);
});

test('The next due time comes from the soonest card that is not due yet', () => {
    const cards = [{id: 'a'}, {id: 'b'}, {id: 'c'}];
    const states = new Map([['a', state(3, 3)], ['b', state(1, 1)], ['c', state(1, -1)]]);
    expect(nextDueText(cards, states)).toBe('in 1d');
    expect(nextDueText(cards, new Map())).toBeNull();
});

test('filterByShow keeps only new, learn or due cards, or everything with no kind', () => {
    const now = Date.now();
    const cards = [{id: 'n'}, {id: 'l'}, {id: 'd'}];
    const states = new Map([
        ['l', state(10 / 1440, -0.01, 0)],
        ['d', state(5, -1)],
    ]);
    const queue = buildQueue(cards, states, now);
    const ids = (show) => filterByShow(queue, states, show).map((card) => card.id);

    expect(ids('new')).toEqual(['n']);
    expect(ids('learn')).toEqual(['l']);
    expect(ids('due')).toEqual(['d']);
    expect(ids(null)).toEqual(queue.map((card) => card.id));
});
