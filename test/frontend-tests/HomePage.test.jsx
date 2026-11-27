import {render, screen, within} from '@testing-library/react';
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

function fakeBackend() {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/') return reply(200, DECKS);
        if (url === '/api/decks/b/subdecks/') {
            return reply(200, [
                {id: 's2', deck_id: 'b', subdeckname: 'Zoology'},
                {id: 's1', deck_id: 'b', subdeckname: 'Cells'},
            ]);
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

// each deck and subdeck has a link to its own page, plus pseudo counts
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
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(200, []));
    renderHome();

    expect(await screen.findByText(/don't have any decks yet/i)).toBeInTheDocument();
});

// expired session: the app is told to go back to login
test('A 401 from the server calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(401, {detail: 'Not authenticated'}));
    renderHome(onUnauthorized);

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
});

// every deck and subdeck row has its own Flashcard mode button
test('Each deck and each shown subdeck has a Flashcard mode button', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    expect(screen.getByRole('link', {name: 'Flashcard mode for Biology'})).toHaveAttribute('href', '/decks/b/flashcards');
    expect(screen.getByRole('link', {name: 'Flashcard mode for Art'})).toHaveAttribute('href', '/decks/a/flashcards');
    expect(screen.queryByRole('link', {name: /Flashcard mode for subdeck/})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Show subdecks of Biology'}));

    expect(screen.getByRole('link', {name: 'Flashcard mode for subdeck Cells'})).toHaveAttribute(
        'href',
        '/decks/b/subdecks/s1/flashcards'
    );
});

// the top button opens a picker: whole deck, one subdeck, or starred cards
test('The Flashcard mode button opens a picker for a whole deck, a subdeck or starred cards', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderHome();
    await screen.findByRole('heading', {name: 'Biology'});

    expect(screen.queryByRole('region', {name: 'Choose what to study'})).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Flashcard mode'}));

    const picker = screen.getByRole('region', {name: 'Choose what to study'});
    expect(within(picker).getByRole('link', {name: 'Flashcard mode for all of Biology'})).toHaveAttribute(
        'href',
        '/decks/b/flashcards'
    );
    expect(
        within(picker).getByRole('link', {name: 'Flashcard mode for subdeck Cells in Biology'})
    ).toHaveAttribute('href', '/decks/b/subdecks/s1/flashcards');
    expect(within(picker).getByRole('link', {name: /Starred cards/})).toHaveAttribute('href', '/flashcards/starred');

    await user.click(within(picker).getByRole('button', {name: 'Close'}));
    expect(screen.queryByRole('region', {name: 'Choose what to study'})).not.toBeInTheDocument();
});
