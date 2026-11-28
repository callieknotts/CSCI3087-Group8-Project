import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import QuizPage from '../../my-app/src/pages/QuizPage';
import TypeItOutPage from '../../my-app/src/pages/TypeItOutPage';
import FrontBackPage from '../../my-app/src/pages/FrontBackPage';
import RepetitionPage from '../../my-app/src/pages/RepetitionPage';
import FlashcardPage from '../../my-app/src/pages/FlashcardPage';
import {vi, afterEach, test, expect} from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

function card(id, front, back) {
    return {
        id,
        deck_id: 'b',
        subdeck_id: null,
        position: 0,
        content: {front: {text: front, image_key: null}, back: {text: back, image_key: null}},
    };
}

const FIVE = [
    card('c1', 'Front one', 'Back one'),
    card('c2', 'Front two', 'Back two'),
    card('c3', 'Front three', 'Back three'),
    card('c4', 'Front four', 'Back four'),
    card('c5', 'Front five', 'Back five'),
];

// answers every request these pages make (cards, stars, review states)
function fakeBackend(cards = FIVE, starredIds = []) {
    const starred = new Set(starredIds);
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
        if (url === '/api/stars/') return reply(200, {card_ids: [...starred]});
        const star = url.match(/^\/api\/stars\/(\w+)$/);
        if (star) {
            const adding = options.method === 'PUT';
            if (adding) starred.add(star[1]);
            else starred.delete(star[1]);
            return reply(200, {card_id: star[1], starred: adding});
        }
        if (url === '/api/decks/b') return reply(200, {id: 'b', deckname: 'Biology'});
        if (url.startsWith('/api/decks/b/cards/')) return reply(200, cards);
        if (url === '/api/reviews/states') {
            return reply(200, {states: [], new_card_intervals: {again: 0.007, hard: 1, good: 1, easy: 4}});
        }
        return reply(500, null);
    });
}

function renderAt(address) {
    return render(
        <MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized: () => {}}} />}>
                    <Route path="decks/:deckId/quiz" element={<QuizPage />} />
                    <Route path="decks/:deckId/type-it-out" element={<TypeItOutPage />} />
                    <Route path="decks/:deckId/front-and-back" element={<FrontBackPage />} />
                    <Route path="decks/:deckId/repetition" element={<RepetitionPage />} />
                    <Route path="decks/:deckId/flashcards" element={<FlashcardPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

function starCalls(spy) {
    return spy.mock.calls
        .filter(([url]) => /^\/api\/stars\/\w/.test(url))
        .map(([url, options]) => [options.method, url]);
}

// ---------- Quiz ----------

test('Quiz: asks about a card with 4 choices and marks the right one', async () => {
    fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/quiz');

    await screen.findByText(/Question 1 of 5/);
    const front = document.querySelector('.study-card .flash-text').textContent;
    const right = FIVE.find((c) => c.content.front.text === front).content.back.text;

    expect(screen.getByRole('group', {name: 'Choose the answer'}).querySelectorAll('button')).toHaveLength(4);
    await user.click(screen.getByRole('button', {name: right}));
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Next question'})).toBeInTheDocument();
});

test('Quiz: says it needs at least 4 cards when there are fewer', async () => {
    fakeBackend(FIVE.slice(0, 3));
    renderAt('/decks/b/quiz');
    expect(await screen.findByText(/needs at least 4 cards/)).toBeInTheDocument();
    expect(screen.queryByRole('group', {name: 'Choose the answer'})).not.toBeInTheDocument();
});

test('Quiz: a wrong answer shows the right one and goes through to the score', async () => {
    fakeBackend(FIVE.slice(0, 4));
    const user = userEvent.setup();
    renderAt('/decks/b/quiz');

    for (let n = 1; n <= 4; n++) {
        await screen.findByText(new RegExp(`Question ${n} of 4`));
        const front = document.querySelector('.study-card .flash-text').textContent;
        const right = FIVE.find((c) => c.content.front.text === front).content.back.text;
        const wrong = FIVE.slice(0, 4).find((c) => c.content.back.text !== right).content.back.text;
        await user.click(screen.getByRole('button', {name: wrong}));
        expect(screen.getByText(/Not quite/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', {name: n === 4 ? 'See score' : 'Next question'}));
    }
    expect(screen.getByText('Quiz complete!')).toBeInTheDocument();
    expect(screen.getByText(/You got 0 of 4 right/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Retry the 4 you missed'})).toBeInTheDocument();
});

test('Quiz: the star stars the card being asked', async () => {
    const spy = fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/quiz');
    await screen.findByText(/Question 1 of 5/);
    const front = document.querySelector('.study-card .flash-text').textContent;
    const id = FIVE.find((c) => c.content.front.text === front).id;

    await user.click(screen.getByRole('button', {name: 'Star this card'}));
    await waitFor(() => expect(starCalls(spy)).toEqual([['PUT', `/api/stars/${id}`]]));
    expect(screen.getByRole('button', {name: 'Remove star from this card'})).toBeInTheDocument();
});

// ---------- Type it out ----------

const WORDS = [card('c1', 'Cell division', 'mitosis'), card('c2', 'Powerhouse', 'two words'), card('c3', 'Café', 'coffee')];

test('Type it out: says it is single-word only and skips cards with longer backs', async () => {
    fakeBackend(WORDS);
    renderAt('/decks/b/type-it-out');
    expect(await screen.findByText(/Single-word answers only/)).toBeInTheDocument();
    expect(screen.getByText(/1 skipped here/)).toBeInTheDocument();
    expect(screen.getByText(/Card 1 of 2/)).toBeInTheDocument();
});

test('Type it out: checks what was typed, ignoring capitals', async () => {
    fakeBackend(WORDS);
    const user = userEvent.setup();
    renderAt('/decks/b/type-it-out');
    await screen.findByText(/Card 1 of 2/);

    await user.type(screen.getByLabelText(/Your answer/), 'Mitosis{Enter}');
    expect(screen.getByText('✓ Correct!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Next card'}));
    await screen.findByText(/Card 2 of 2/);
    await user.type(screen.getByLabelText(/Your answer/), 'tea{Enter}');
    expect(screen.getByText(/Not quite/)).toBeInTheDocument();
    expect(screen.getByText(/The answer is “coffee”/)).toBeInTheDocument();
});

test('Type it out: says so when no card has a one-word back', async () => {
    fakeBackend([card('c1', 'a', 'two words'), card('c2', 'b', 'also two words')]);
    renderAt('/decks/b/type-it-out');
    expect(await screen.findByText(/nothing to type/)).toBeInTheDocument();
});

// ---------- Front & back ----------

test('Front & back: shows the front and the back at the same time', async () => {
    fakeBackend();
    renderAt('/decks/b/front-and-back');
    expect(await screen.findByText('Front one')).toBeInTheDocument();
    expect(screen.getByText('Back one')).toBeInTheDocument();
});

test('Front & back: next and previous move between cards, and the star saves', async () => {
    const spy = fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/front-and-back');
    await screen.findByText('Front one');

    await user.click(screen.getByRole('button', {name: 'Next card'}));
    expect(screen.getByText('Front two')).toBeInTheDocument();
    expect(screen.getByText('Back two')).toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Star this card'}));
    await waitFor(() => expect(starCalls(spy)).toEqual([['PUT', '/api/stars/c2']]));

    await user.click(screen.getByRole('button', {name: 'Previous card'}));
    expect(screen.getByText('Front one')).toBeInTheDocument();
});

test('Front & back: Shuffle keeps all the cards and Original order puts them back', async () => {
    fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/front-and-back');
    await screen.findByText('Front one');

    await user.click(screen.getByRole('button', {name: /Shuffle/}));
    expect(screen.getByText('1 / 5')).toBeInTheDocument(); // starts again from the first card

    // walk through every card: each one is there exactly once
    const seen = [];
    for (let i = 0; i < 5; i++) {
        seen.push(document.querySelector('.fb-side:not(.fb-side--back) .flash-text').textContent);
        if (i < 4) await user.click(screen.getByRole('button', {name: 'Next card'}));
    }
    expect([...seen].sort()).toEqual(FIVE.map((c) => c.content.front.text).sort());

    await user.click(screen.getByRole('button', {name: 'Original order'}));
    expect(screen.getByText('Front one')).toBeInTheDocument();
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
});

// ---------- Classic and Repetition ----------

test('Classic: Shuffle restarts from card 1 and Original order brings back the deck order', async () => {
    fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/flashcards');
    await screen.findByText('1 / 5');

    await user.click(screen.getByRole('button', {name: /Shuffle/}));
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Original order'}));
    expect(document.querySelector('.flash-face--front .flash-text').textContent).toBe('Front one');
});

test('Repetition: has a star that saves, and a Shuffle that keeps every card', async () => {
    const spy = fakeBackend();
    const user = userEvent.setup();
    renderAt('/decks/b/repetition');
    await screen.findByText('New 5');

    const first = document.querySelector('.flash-face--front .flash-text').textContent;
    const id = FIVE.find((c) => c.content.front.text === first).id;
    await user.click(screen.getByRole('button', {name: 'Star this card'}));
    await waitFor(() => expect(starCalls(spy)).toEqual([['PUT', `/api/stars/${id}`]]));

    await user.click(screen.getByRole('button', {name: /Shuffle/}));
    expect(screen.getByText('New 5')).toBeInTheDocument(); // still all 5 cards to go
});
