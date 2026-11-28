import {render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import StarredPage from '../../my-app/src/pages/StarredPage';
import {vi, afterEach, test, expect} from 'vitest';

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

// a card the way the backend sends it
function card(id, deckId, front, subdeckId = null) {
    return {
        id,
        deck_id: deckId,
        subdeck_id: subdeckId,
        position: 0,
        content: {front: {text: front, image_key: null}, back: {text: `${front} back`, image_key: null}},
    };
}

const DECKS = [
    {id: 'b', deckname: 'Biology'},
    {id: 'a', deckname: 'Art'},
    {id: 'c', deckname: 'Chemistry'},
];
const CARDS = {
    b: [card('c1', 'b', 'Cell front', 's1'), card('c2', 'b', 'Organ front', 's2'), card('c3', 'b', 'Loose front')],
    a: [card('c4', 'a', 'Paint front')],
    c: [card('c5', 'c', 'Atom front')],
};

// answers the requests the starred page makes; starredIds are the user's stars
function fakeBackend(starredIds = [], {failStarring = false} = {}) {
    const starred = new Set(starredIds);
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
        if (url === '/api/stars/') return reply(200, {card_ids: [...starred]});
        const star = url.match(/^\/api\/stars\/(\w+)$/);
        if (star) {
            if (failStarring) return reply(404, {detail: 'Card not found'});
            const adding = options?.method === 'PUT';
            if (adding) starred.add(star[1]);
            else starred.delete(star[1]);
            return reply(200, {card_id: star[1], starred: adding});
        }
        if (url === '/api/decks/') return reply(200, DECKS);
        if (url === '/api/decks/b') return reply(200, DECKS[0]);
        if (url === '/api/decks/b/subdecks/s1') return reply(200, {id: 's1', deck_id: 'b', subdeckname: 'Cells'});
        if (url === '/api/decks/b/cards/?subdeck_id=s1') return reply(200, [CARDS.b[0]]);
        const cardsOfDeck = url.match(/^\/api\/decks\/(\w+)\/cards\/$/);
        if (cardsOfDeck) return reply(200, CARDS[cardsOfDeck[1]] ?? []);
        return reply(500, null);
    });
}

// renders the page at an address, inside the context the Layout normally gives it
function renderAt(address) {
    return render(
        <MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized: () => {}}} />}>
                    <Route path="starred" element={<StarredPage />} />
                    <Route path="decks/:deckId/starred" element={<StarredPage />} />
                    <Route path="decks/:deckId/subdecks/:subdeckId/starred" element={<StarredPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

test('Lists the starred cards from every deck, grouped by deck', async () => {
    fakeBackend(['c1', 'c4']);
    renderAt('/starred');

    expect(await screen.findByText('Cell front')).toBeInTheDocument();
    expect(screen.getByText('Paint front')).toBeInTheDocument();
    expect(screen.queryByText('Organ front')).not.toBeInTheDocument(); // not starred
    expect(screen.getByRole('heading', {name: 'Biology'})).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Art'})).toBeInTheDocument();
    expect(screen.queryByRole('heading', {name: 'Chemistry'})).not.toBeInTheDocument(); // nothing starred in it
    expect(screen.getByText(/2 starred cards/)).toBeInTheDocument();
});

test('The all-decks starred page has a review-mode menu for studying starred cards', async () => {
    const user = userEvent.setup();
    fakeBackend(['c1']);
    renderAt('/starred');
    await screen.findByText('Cell front');

    await user.click(screen.getByRole('button', {name: /review mode classic/i}));

    expect(screen.getByRole('menuitem', {name: 'Classic'})).toHaveAttribute('href', '/flashcards/starred');
    expect(screen.getByRole('menuitem', {name: 'Repetition'})).toHaveAttribute('href', '/flashcards/starred/repetition');
});

test('Explains when nothing is starred', async () => {
    fakeBackend([]);
    renderAt('/starred');

    expect(await screen.findByText(/haven't starred any cards yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /review mode classic/i})).not.toBeInTheDocument();
});

test('A deck page shows only that deck\'s starred cards', async () => {
    fakeBackend(['c1', 'c3', 'c4']);
    renderAt('/decks/b/starred');

    expect(await screen.findByText('Cell front')).toBeInTheDocument();
    expect(screen.getByText('Loose front')).toBeInTheDocument();
    expect(screen.queryByText('Paint front')).not.toBeInTheDocument(); // starred, but in Art
    expect(screen.getByText(/in Biology · 2 starred cards/)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /← Biology/})).toHaveAttribute('href', '/decks/b');
    expect(screen.queryByRole('button', {name: /review mode classic/i})).not.toBeInTheDocument();
});

test('A subdeck page asks the backend only for that subdeck', async () => {
    const spy = fakeBackend(['c1', 'c2']);
    renderAt('/decks/b/subdecks/s1/starred');

    expect(await screen.findByText('Cell front')).toBeInTheDocument();
    expect(screen.queryByText('Organ front')).not.toBeInTheDocument();
    expect(screen.getByText(/in Cells · 1 starred card\b/)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: /← Cells/})).toHaveAttribute('href', '/decks/b/subdecks/s1');
    expect(spy.mock.calls.map((call) => call[0])).toContain('/api/decks/b/cards/?subdeck_id=s1');
});

test('Un-starring a card saves it, keeps the card on the page and lowers the count', async () => {
    const user = userEvent.setup();
    const spy = fakeBackend(['c1', 'c4']);
    renderAt('/starred');
    const cellRow = (await screen.findByText('Cell front')).closest('li');

    await user.click(within(cellRow).getByRole('button', {name: 'Remove star from this card'}));

    expect(screen.getByText('Cell front')).toBeInTheDocument(); // still there, so it can be starred again
    expect(within(cellRow).getByRole('button', {name: 'Star this card'})).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/1 starred card\b/)).toBeInTheDocument();
    await waitFor(() => {
        const deletes = spy.mock.calls.filter(([url, options]) => options?.method === 'DELETE' && url === '/api/stars/c1');
        expect(deletes).toHaveLength(1);
    });

    await user.click(within(cellRow).getByRole('button', {name: 'Star this card'}));
    expect(screen.getByText(/2 starred cards/)).toBeInTheDocument();
});

test('If the backend cannot save the change, the star goes back and says why', async () => {
    const user = userEvent.setup();
    fakeBackend(['c1'], {failStarring: true});
    renderAt('/starred');
    const row = (await screen.findByText('Cell front')).closest('li');

    await user.click(within(row).getByRole('button', {name: 'Remove star from this card'}));

    expect(await screen.findByRole('alert')).toHaveTextContent('Card not found');
    expect(within(row).getByRole('button', {name: 'Remove star from this card'})).toHaveAttribute('aria-pressed', 'true');
});

test('A deck that does not exist shows an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/stars/') return reply(200, {card_ids: []});
        if (url === '/api/decks/b') return reply(200, null); // how the backend says "no such deck"
        return reply(200, []);
    });
    renderAt('/decks/b/starred');

    expect(await screen.findByRole('alert')).toHaveTextContent('That deck could not be found.');
});
