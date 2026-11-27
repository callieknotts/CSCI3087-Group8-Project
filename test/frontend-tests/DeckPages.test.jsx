import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import DeckPage from '../../my-app/src/pages/DeckPage';
import SubdeckPage from '../../my-app/src/pages/SubdeckPage';
import {vi, afterEach, test, expect} from 'vitest';

afterEach(() => {
    vi.restoreAllMocks();
});

// fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

function card(id, front, back, subdeckId) {
    return {
        id,
        deck_id: 'b',
        subdeck_id: subdeckId,
        position: 0,
        content: {front: {text: front, image_key: null}, back: {text: back, image_key: null}},
    };
}

// Deck "b" has two subdecks (Cells, Zoology) and one card that is in no subdeck
const CARDS = [
    card('c1', 'Nucleus?', 'Holds the DNA', 's1'),
    card('c2', 'Lion?', 'Panthera leo', 's2'),
    card('c3', 'Loose front', 'Loose back', null),
];

function fakeBackend({subdecks = true} = {}) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/b') return reply(200, {id: 'b', deckname: 'Biology', description: 'Life science'});
        if (url === '/api/decks/b/subdecks/') {
            return subdecks
                ? reply(200, [
                      {id: 's1', deck_id: 'b', subdeckname: 'Cells'},
                      {id: 's2', deck_id: 'b', subdeckname: 'Zoology'},
                  ])
                : reply(500, null); // how the backend says "no subdecks"
        }
        if (url === '/api/decks/b/subdecks/s1') return reply(200, {id: 's1', deck_id: 'b', subdeckname: 'Cells'});
        if (url === '/api/decks/b/cards/') return reply(200, subdecks ? CARDS : [card('c3', 'Loose front', 'Loose back', null)]);
        if (url === '/api/decks/b/cards/?subdeck_id=s1') return reply(200, [CARDS[0]]);
        return reply(500, null);
    });
}

function renderAt(address) {
    return render(
        <MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized: () => {}}} />}>
                    <Route path="decks/:deckId" element={<DeckPage />} />
                    <Route path="decks/:deckId/subdecks/:subdeckId" element={<SubdeckPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

test('A deck page shows each subdeck with its cards, and the cards in no subdeck', async () => {
    fakeBackend();
    renderAt('/decks/b');

    expect(await screen.findByRole('heading', {name: 'Biology', level: 1})).toBeInTheDocument();
    expect(screen.getByText('Life science')).toBeInTheDocument();

    const cells = screen.getByRole('region', {name: 'Cells'});
    expect(within(cells).getByText('Nucleus?')).toBeInTheDocument();
    expect(within(cells).queryByText('Lion?')).not.toBeInTheDocument();

    const zoology = screen.getByRole('region', {name: 'Zoology'});
    expect(within(zoology).getByText('Panthera leo')).toBeInTheDocument();

    const loose = screen.getByRole('region', {name: 'Cards without a subdeck'});
    expect(within(loose).getByText('Loose front')).toBeInTheDocument();
});

// the "Mode" dropdown: closed until clicked, then lists the modes as links
async function openModes(user) {
    await user.click(screen.getByRole('button', {name: /choose mode/i}));
}

test('A deck page has one Mode dropdown, for the whole deck, and none on each subdeck', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b');
    await screen.findByRole('heading', {name: 'Biology', level: 1});

    expect(screen.getAllByRole('button', {name: /choose mode/i})).toHaveLength(1);
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

    await openModes(user);
    const items = screen.getAllByRole('menuitem', {name: 'Classic'});
    expect(items.map((a) => a.getAttribute('href'))).toEqual(['/decks/b/flashcards']);

    // Repetition is only a placeholder for now: listed, but disabled and not a link
    const repetition = screen.getByRole('menuitem', {name: /repetition/i});
    expect(repetition).toHaveAttribute('aria-disabled', 'true');
    expect(repetition).not.toHaveAttribute('href');
});

test('The Mode dropdown closes with Escape and when a click lands elsewhere', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b');
    await screen.findByRole('heading', {name: 'Biology', level: 1});

    await openModes(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();

    await openModes(user);
    await user.click(screen.getByRole('heading', {name: 'Biology', level: 1}));
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
});

test('A subdeck name on the deck page links to the subdeck page', async () => {
    fakeBackend();
    renderAt('/decks/b');
    await screen.findByRole('heading', {name: 'Biology', level: 1});

    expect(screen.getByRole('link', {name: 'Cells'})).toHaveAttribute('href', '/decks/b/subdecks/s1');
});

test('A deck with no subdecks lists its own cards (the 500 for no subdecks is not an error)', async () => {
    fakeBackend({subdecks: false});
    renderAt('/decks/b');

    expect(await screen.findByText('Loose front')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await openModes(userEvent.setup());
    expect(screen.getByRole('menuitem', {name: 'Classic'})).toHaveAttribute('href', '/decks/b/flashcards');
});

test('A deck that does not exist shows a message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/b') return reply(200, null);
        return reply(200, []);
    });
    renderAt('/decks/b');

    expect(await screen.findByText('That deck could not be found.')).toBeInTheDocument();
});

test('A subdeck page shows only its cards and its own Mode dropdown', async () => {
    fakeBackend();
    renderAt('/decks/b/subdecks/s1');

    expect(await screen.findByRole('heading', {name: 'Cells', level: 1})).toBeInTheDocument();
    expect(screen.getByText('Nucleus?')).toBeInTheDocument();
    expect(screen.queryByText('Lion?')).not.toBeInTheDocument();
    await openModes(userEvent.setup());
    expect(screen.getByRole('menuitem', {name: 'Classic'})).toHaveAttribute(
        'href',
        '/decks/b/subdecks/s1/flashcards'
    );
    expect(screen.getByRole('link', {name: '← Biology'})).toHaveAttribute('href', '/decks/b');
});

test('A subdeck that does not exist shows a message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/b') return reply(200, {id: 'b', deckname: 'Biology'});
        if (url.includes('/cards/')) return reply(200, []);
        return reply(500, null); // the backend's answer for a missing subdeck
    });
    renderAt('/decks/b/subdecks/zzz');

    expect(await screen.findByText('That subdeck could not be found.')).toBeInTheDocument();
});
