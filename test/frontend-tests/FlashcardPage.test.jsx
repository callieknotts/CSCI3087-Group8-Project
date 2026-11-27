import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import FlashcardPage from '../../my-app/src/pages/FlashcardPage';
import {vi, afterEach, beforeEach, test, expect} from 'vitest';

beforeEach(() => {
    localStorage.clear();
});

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

// a card the way the backend sends it
function card(id, front, back, subdeckId = null) {
    return {
        id,
        deck_id: 'b',
        subdeck_id: subdeckId,
        position: 0,
        content: {front: {text: front, image_key: null}, back: {text: back, image_key: null}},
    };
}

const CARDS = [card('c1', 'Front one', 'Back one'), card('c2', 'Front two', 'Back two'), card('c3', 'Front three', 'Back three')];

// answers the requests the flashcard page makes; returns the spy so tests can read the calls
function fakeBackend(cards = CARDS) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/b') return reply(200, {id: 'b', deckname: 'Biology'});
        if (url === '/api/decks/b/subdecks/s1') return reply(200, {id: 's1', deck_id: 'b', subdeckname: 'Cells'});
        if (url.startsWith('/api/decks/b/cards/')) return reply(200, cards);
        if (url === '/api/decks/') return reply(200, [{id: 'b', deckname: 'Biology'}]);
        return reply(500, null);
    });
}

// renders the page at an address, inside the context the Layout normally gives it
function renderAt(address) {
    return render(
        <MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized: () => {}}} />}>
                    <Route path="decks/:deckId/flashcards" element={<FlashcardPage />} />
                    <Route path="decks/:deckId/subdecks/:subdeckId/flashcards" element={<FlashcardPage />} />
                    <Route path="flashcards/starred" element={<FlashcardPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

// the text currently on the card
function cardText() {
    return document.querySelector('.flash-text').textContent;
}

test('Starts on the front of the first card', async () => {
    fakeBackend();
    renderAt('/decks/b/flashcards');

    expect(await screen.findByText('Front one')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.queryByText('Back one')).not.toBeInTheDocument();
});

test('Space flips to the back and flips back again', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    await user.keyboard(' ');
    expect(cardText()).toBe('Back one');

    await user.keyboard(' ');
    expect(cardText()).toBe('Front one');
});

test('The up arrow key flips the card', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    await user.keyboard('{ArrowUp}');
    expect(cardText()).toBe('Back one');

    await user.keyboard('{ArrowUp}');
    expect(cardText()).toBe('Front one');
});

test('Clicking the card flips it', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');

    await user.click(await screen.findByRole('button', {name: /Click to flip/}));
    expect(cardText()).toBe('Back one');

    await user.click(screen.getByRole('button', {name: /Click to flip/}));
    expect(cardText()).toBe('Front one');
});

test('The right arrow key and the Next button go to the next card, on its front', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    await user.keyboard(' '); // flip card 1 to its back
    await user.keyboard('{ArrowRight}');
    expect(cardText()).toBe('Front two'); // a new card starts on its front

    await user.click(screen.getByRole('button', {name: 'Next card'}));
    expect(cardText()).toBe('Front three');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
});

test('The left arrow key and the Previous button go back a card', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(cardText()).toBe('Front three');

    await user.keyboard('{ArrowLeft}');
    expect(cardText()).toBe('Front two');

    await user.click(screen.getByRole('button', {name: 'Previous card'}));
    expect(cardText()).toBe('Front one');
});

test('Previous is disabled on the first card and Next on the last', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    expect(screen.getByRole('button', {name: 'Previous card'})).toBeDisabled();
    expect(screen.getByRole('button', {name: 'Next card'})).toBeEnabled();

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}'); // one too many does nothing
    expect(cardText()).toBe('Front three');
    expect(screen.getByRole('button', {name: 'Next card'})).toBeDisabled();
});

test('Starring a card is remembered and does not flip the card', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    await user.click(screen.getByRole('button', {name: 'Star this card'}));

    expect(cardText()).toBe('Front one'); // the click on the star did not flip the card
    expect(screen.getByRole('button', {name: 'Remove star from this card'})).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem('rebelreview:starred:u1'))).toEqual(['c1']);

    await user.click(screen.getByRole('button', {name: 'Remove star from this card'}));
    expect(JSON.parse(localStorage.getItem('rebelreview:starred:u1'))).toEqual([]);
});

test('A whole deck asks the backend for every card, with no subdeck filter', async () => {
    const spy = fakeBackend();
    renderAt('/decks/b/flashcards');
    await screen.findByText('Front one');

    const urls = spy.mock.calls.map((call) => call[0]);
    expect(urls).toContain('/api/decks/b/cards/');
});

test('A subdeck asks the backend only for that subdeck and shows its name', async () => {
    const spy = fakeBackend([card('c9', 'Cell front', 'Cell back', 's1')]);
    renderAt('/decks/b/subdecks/s1/flashcards');

    expect(await screen.findByText('Cell front')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Cells'})).toBeInTheDocument();
    const urls = spy.mock.calls.map((call) => call[0]);
    expect(urls).toContain('/api/decks/b/cards/?subdeck_id=s1');
});

test('Starred cards mode shows only starred cards from the decks', async () => {
    localStorage.setItem('rebelreview:starred:u1', JSON.stringify(['c2']));
    fakeBackend();
    renderAt('/flashcards/starred');

    expect(await screen.findByText('Front two')).toBeInTheDocument();
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Starred cards'})).toBeInTheDocument();
});

test('Starred cards mode explains when nothing is starred', async () => {
    fakeBackend();
    renderAt('/flashcards/starred');

    expect(await screen.findByText(/haven't starred any cards yet/i)).toBeInTheDocument();
});

test('A deck with no cards says there is nothing to study', async () => {
    fakeBackend([]);
    renderAt('/decks/b/flashcards');

    expect(await screen.findByText(/no cards here yet/i)).toBeInTheDocument();
});

test('A side that is only an image shows a note instead of text', async () => {
    const imageOnly = {
        id: 'i1',
        deck_id: 'b',
        subdeck_id: null,
        position: 0,
        content: {front: {text: null, image_key: 'abc.png'}, back: {text: 'Back', image_key: null}},
    };
    fakeBackend([imageOnly]);
    renderAt('/decks/b/flashcards');

    expect(await screen.findByText(/This side is an image/)).toBeInTheDocument();
});

test('A deck that does not exist shows an error message', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        if (url === '/api/decks/b') return reply(200, null); // the backend's answer for a missing deck
        return reply(200, []);
    });
    renderAt('/decks/b/flashcards');

    expect(await screen.findByText('That deck could not be found.')).toBeInTheDocument();
});

test('A 401 from the server calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(401, {detail: 'Not authenticated'}));
    render(
        <MemoryRouter initialEntries={['/decks/b/flashcards']}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized}} />}>
                    <Route path="decks/:deckId/flashcards" element={<FlashcardPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );

    await waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
});
