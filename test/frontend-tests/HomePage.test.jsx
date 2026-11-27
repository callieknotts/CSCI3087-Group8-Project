import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import HomePage from '../../my-app/src/pages/HomePage';
import {vi, afterEach, test, expect} from 'vitest';

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

// Deck "b" has two subdecks, deck "c" has none (the backend answers 500 for that)
const DECKS = [
    {id: 'b', deckname: 'Biology', description: null, created_at: '2026-11-02T10:00:00'},
    {id: 'a', deckname: 'Art', description: null, created_at: '2026-11-03T10:00:00'},
    {id: 'c', deckname: 'Chemistry', description: null, created_at: '2026-11-01T10:00:00'},
];

const DAY = 86_400_000;

// a card the way the backend sends it
function card(id, deckId, subdeckId = null) {
    return {
        id,
        deck_id: deckId,
        subdeck_id: subdeckId,
        position: 0,
        content: {front: {text: id, image_key: null}, back: {text: id, image_key: null}},
    };
}

// a review state the way the backend sends it: a card reviewed before, due `dueInDays` from now
function state(cardId, intervalDays, dueInDays) {
    return {
        id: `s-${cardId}`,
        user_id: 'u1',
        card_id: cardId,
        repetitions: 2,
        ease_factor: 2.5,
        interval_days: intervalDays,
        due_at: new Date(Date.now() + dueInDays * DAY).toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapses: 0,
        learning_step: 0,
        next_intervals: {again: 10 / 1440, hard: 1, good: 1, easy: 4},
    };
}

// Biology: c1 is new and c2 is due (both in Cells), c3 is being relearned and c4 is not due
// until later (both in Zoology), c5 is new and in no subdeck. Art has no cards.
// Chemistry has one new card.
const CARDS = {
    b: [card('c1', 'b', 's1'), card('c2', 'b', 's1'), card('c3', 'b', 's2'), card('c4', 'b', 's2'), card('c5', 'b')],
    a: [],
    c: [card('c6', 'c')],
};
const STATES = [state('c2', 5, -1), state('c3', 10 / 1440, -0.01), state('c4', 5, 3)];

function fakeBackend({decks = DECKS, cards = CARDS, states = STATES} = {}) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/') return reply(200, decks);
        if (url === '/api/decks/b/subdecks/') {
            return reply(200, [
                {id: 's2', deck_id: 'b', subdeckname: 'Zoology'},
                {id: 's1', deck_id: 'b', subdeckname: 'Cells'},
            ]);
        }
        const cardsOfDeck = url.match(/^\/api\/decks\/(\w+)\/cards\/$/);
        if (cardsOfDeck) return reply(200, cards[cardsOfDeck[1]] ?? []);
        if (url === '/api/reviews/states') {
            return reply(200, {states, new_card_intervals: {again: 10 / 1440, hard: 1, good: 1, easy: 4}});
        }
        return reply(500, null); // decks with no subdecks
    });
}

// renders the page inside a router, with the context the Layout normally gives it
function renderHome(onUnauthorized = () => {}) {
    return render(
        <MemoryRouter>
            <Routes>
                <Route element={<Outlet context={{user: {name: 'Fred'}, onUnauthorized}} />}>
                    <Route index element={<HomePage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

// the deck names in the order they appear on the page
function deckOrder() {
    return screen.getAllByRole('heading', {level: 2}).map((h) => h.textContent);
}

// default: sorted by created at, ascending (oldest first)
test('Library lists the decks sorted by created at, oldest first', async () => {
    fakeBackend();
    renderHome();

    await screen.findByRole('heading', {name: 'Biology'});

    expect(deckOrder()).toEqual(['Chemistry', 'Biology', 'Art']);
});

// the Order dropdown flips the list
test('Choosing Desc reverses the order', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    await user.selectOptions(screen.getByLabelText('Order'), 'desc');

    expect(deckOrder()).toEqual(['Art', 'Biology', 'Chemistry']);
});

// the Sort by dropdown can sort by name
test('Sorting by deck name puts the decks in alphabetical order', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    await user.selectOptions(screen.getByLabelText('Sort by'), 'deckname');

    expect(deckOrder()).toEqual(['Art', 'Biology', 'Chemistry']);
});

// only decks that have subdecks get an arrow, and subdecks are alphabetical
test('A deck with subdecks has an arrow that shows them alphabetically', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    expect(screen.getAllByRole('button', {name: /subdecks of/i})).toHaveLength(1);
    expect(screen.queryByText(/Cells/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    const rows = screen.getAllByText(/^– /).map((el) => el.textContent);
    expect(rows).toEqual(['– Cells', '– Zoology']);
});

// each deck and subdeck has a link to its own page, plus its New / Learn / Due numbers
test('Decks and subdecks have See buttons with paths and show counts', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    const links = screen.getAllByRole('link', {name: /^See Deck$/});
    expect(links.map((a) => a.getAttribute('href')).sort()).toEqual(['/decks/a', '/decks/b', '/decks/c']);
    expect(screen.getAllByRole('link', {name: 'See Subdeck'}).map((a) => a.getAttribute('href')))
        .toEqual(['/decks/b/subdecks/s1', '/decks/b/subdecks/s2']);
    expect(screen.getAllByText('New')).toHaveLength(5); // 3 decks + 2 subdecks
    expect(screen.getAllByText('Learn')).toHaveLength(5);
    expect(screen.getAllByText('Due')).toHaveLength(5);
});

// the three numbers of the row that a name belongs to, for example {New: '2', Learn: '1', Due: '0'}
function countsOf(nameElement) {
    const row = nameElement.closest('.library-row');
    return Object.fromEntries(
        [...row.querySelectorAll('.count')].map((count) => [
            count.querySelector('span').textContent,
            count.querySelector('b').textContent,
        ])
    );
}

// the numbers are what Repetition mode would start with: due cards, learning cards and new cards
test('Each deck and subdeck shows how many cards are new, to learn and due', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});
    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    // a deck counts every card in it, including the ones inside its subdecks;
    // c4 is not due until later, so it is not counted anywhere
    expect(countsOf(screen.getByRole('heading', {name: 'Biology'}))).toEqual({New: '2', Learn: '1', Due: '1'});
    expect(countsOf(screen.getByText('– Cells'))).toEqual({New: '1', Learn: '0', Due: '1'});
    expect(countsOf(screen.getByText('– Zoology'))).toEqual({New: '0', Learn: '1', Due: '0'});
    expect(countsOf(screen.getByRole('heading', {name: 'Chemistry'}))).toEqual({New: '1', Learn: '0', Due: '0'});
    expect(countsOf(screen.getByRole('heading', {name: 'Art'}))).toEqual({New: '0', Learn: '0', Due: '0'});
});

// the numbers are links: each opens Repetition mode for that deck or subdeck with only that kind of card
test('The New, Learn and Due numbers link to Repetition mode for just those cards', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});
    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    const href = (name) => screen.getByRole('link', {name}).getAttribute('href');
    expect(href('Study 2 new cards in Biology')).toBe('/decks/b/repetition?show=new');
    expect(href('Study 1 learning card in Biology')).toBe('/decks/b/repetition?show=learn');
    expect(href('Study 1 due card in Biology')).toBe('/decks/b/repetition?show=due');
    expect(href('Study 1 new card in Cells')).toBe('/decks/b/subdecks/s1/repetition?show=new');
    expect(href('Study 1 learning card in Zoology')).toBe('/decks/b/subdecks/s2/repetition?show=learn');

    // a number of 0 is plain text, not a link: there would be nothing to study
    expect(screen.queryByRole('link', {name: /in Art$/})).not.toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Study 0 due cards in Chemistry'})).not.toBeInTheDocument();
});

test('A deck counts every never-reviewed card as new (no cap by default)', async () => {
    const manyNewCards = Array.from({length: 25}, (_, i) => card(`n${i}`, 'c'));
    fakeBackend({cards: {...CARDS, c: manyNewCards}});
    renderHome();
    await screen.findByRole('heading', {name: 'Chemistry'});

    expect(countsOf(screen.getByRole('heading', {name: 'Chemistry'})).New).toBe('25');
});

test('Cards the user has reviewed are not counted as new', async () => {
    fakeBackend({states: [state('c6', 5, 2)]}); // Chemistry's only card, reviewed and due in 2 days
    renderHome();
    await screen.findByRole('heading', {name: 'Chemistry'});

    expect(countsOf(screen.getByRole('heading', {name: 'Chemistry'}))).toEqual({New: '0', Learn: '0', Due: '0'});
});

// "Search your decks" is only a placeholder: it takes text but filters nothing yet
test('Search your decks takes text but does not filter yet', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    const box = screen.getByRole('searchbox', {name: 'Search your decks'});
    await user.type(box, 'zzz');

    expect(box).toHaveValue('zzz');
    expect(deckOrder()).toHaveLength(3);
});

// empty library message
test('Shows a message when there are no decks', async () => {
    fakeBackend({decks: []});
    renderHome();

    expect(await screen.findByText(/don't have any decks yet/i)).toBeInTheDocument();
});

// the numbers cannot be worked out without the review states, so the library says so
test('Shows an error with a retry button when the review states cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
        url === '/api/decks/' ? reply(200, DECKS) : reply(500, null)
    );
    renderHome();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong (error 500).');
    expect(screen.getByRole('button', {name: 'Try again'})).toBeInTheDocument();
});

// expired session: the app is told to go back to login
test('A 401 from the server calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(401, {detail: 'Not authenticated'}));
    renderHome(onUnauthorized);

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
});

// flashcard mode lives inside each deck and subdeck page, not on the homepage
test('The homepage has no Flashcard mode buttons, even with subdecks open', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    expect(screen.queryByRole('link', {name: /flashcard/i})).not.toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /flashcard/i})).not.toBeInTheDocument();
});

// the only way to reach the starred cards is this link
test('The homepage has a Starred cards link', async () => {
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    expect(screen.getByRole('link', {name: /Starred cards/})).toHaveAttribute('href', '/flashcards/starred');
});
