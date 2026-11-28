import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Outlet, Route, Routes} from 'react-router-dom';
import RepetitionPage from '../../my-app/src/pages/RepetitionPage';
import {vi, afterEach, test, expect} from 'vitest';

const DAY = 86_400_000;

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

// a card the way the backend sends it
function card(id, front, back) {
    return {
        id,
        deck_id: 'b',
        subdeck_id: null,
        position: 0,
        content: {front: {text: front, image_key: null}, back: {text: back, image_key: null}},
    };
}

// what the backend says the four rating buttons do (days). Made-up numbers: the page must show
// these as they are and not work anything out itself.
const NEW_CARD_INTERVALS = {again: 10 / 1440, hard: 1, good: 1, easy: 4};
const CARD_INTERVALS = {again: 0.5, hard: 2, good: 12, easy: 30};

// a review state the way the backend sends it
function state(cardId, intervalDays, dueInDays, repetitions = 2, nextIntervals = CARD_INTERVALS) {
    return {
        id: `s-${cardId}`,
        user_id: 'u1',
        card_id: cardId,
        repetitions,
        ease_factor: 2.5,
        interval_days: intervalDays,
        due_at: new Date(Date.now() + dueInDays * DAY).toISOString(),
        last_reviewed_at: new Date().toISOString(),
        lapses: 0,
        learning_step: 0,
        next_intervals: nextIntervals,
    };
}

// c1 was never reviewed (new), c2 is due, c3 is scheduled for later
const CARDS = [card('c1', 'Front one', 'Back one'), card('c2', 'Front two', 'Back two'), card('c3', 'Front three', 'Back three')];
const STATES = [state('c2', 3, -1), state('c3', 3, 2)];

// answers the requests the page makes; saving a review answers with the card's new state
function fakeBackend({cards = CARDS, states = STATES, saveStatus = 200} = {}) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
        if (url === '/api/decks/b') return reply(200, {id: 'b', deckname: 'Biology'});
        if (url.startsWith('/api/decks/b/cards/')) return reply(200, cards);
        if (url === '/api/reviews/states') return reply(200, {states, new_card_intervals: NEW_CARD_INTERVALS});
        if (url.startsWith('/api/reviews/') && options.method === 'POST') {
            if (saveStatus !== 200) return reply(saveStatus, {detail: 'Could not save that review.'});
            const cardId = url.split('/').pop();
            const {rating} = JSON.parse(options.body);
            return rating === 'again' ? reply(200, state(cardId, 10 / 1440, 0, 0)) : reply(200, state(cardId, 1, 1, 1));
        }
        return reply(500, null);
    });
}

// the review requests the page has sent: [{cardId, rating}]
function savedReviews(fetchSpy) {
    return fetchSpy.mock.calls
        .filter(([url, options]) => url.startsWith('/api/reviews/') && options?.method === 'POST')
        .map(([url, options]) => ({cardId: url.split('/').pop(), rating: JSON.parse(options.body).rating}));
}

// renders the page at an address, inside the context the Layout normally gives it
function renderAt(address = '/decks/b/repetition') {
    return render(
        <MemoryRouter initialEntries={[address]}>
            <Routes>
                <Route element={<Outlet context={{user: {id: 'u1'}, onUnauthorized: () => {}}} />}>
                    <Route path="decks/:deckId/repetition" element={<RepetitionPage />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

// the text on the face of the card that is showing (the other face is turned away, aria-hidden)
function cardText() {
    return document.querySelector('.flash-face[aria-hidden="false"] .flash-text').textContent;
}

test('Studies the due cards first, then the new ones, and leaves out cards due later', async () => {
    fakeBackend();
    renderAt();

    expect(await screen.findByText('Front two')).toBeInTheDocument();
    expect(screen.getByText('New 1')).toBeInTheDocument();
    expect(screen.getByText('Learn 0')).toBeInTheDocument();
    expect(screen.getByText('Due 1')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2');
    expect(screen.queryByRole('button', {name: /Good/})).not.toBeInTheDocument();
});

test('?show=due studies only the due cards and offers a way back to everything', async () => {
    fakeBackend();
    renderAt('/decks/b/repetition?show=due');

    expect(await screen.findByText('Front two')).toBeInTheDocument();
    expect(screen.getByText('Due 1')).toBeInTheDocument();
    expect(screen.getByText('New 0')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '1');
    expect(screen.getByText(/Only due cards/)).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Study everything'})).toHaveAttribute('href', '/decks/b/repetition');
});

test('?show=new studies only the new cards', async () => {
    fakeBackend();
    renderAt('/decks/b/repetition?show=new');

    expect(await screen.findByText('Front one')).toBeInTheDocument();
    expect(screen.getByText('New 1')).toBeInTheDocument();
    expect(screen.getByText('Due 0')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '1');
});

test('An unknown ?show= value studies everything', async () => {
    fakeBackend();
    renderAt('/decks/b/repetition?show=whatever');

    expect(await screen.findByText('Front two')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '2');
    expect(screen.queryByText(/Only .* cards/)).not.toBeInTheDocument();
});

test('Show answer turns the card over and shows each rating with when the card returns', async () => {
    const user = userEvent.setup();
    fakeBackend();
    renderAt();
    await screen.findByText('Front two');

    await user.click(screen.getByRole('button', {name: 'Show answer'}));

    expect(cardText()).toBe('Back two');
    // the backend's numbers (0.5, 2, 12 and 30 days), written out
    expect(screen.getByRole('button', {name: /^Again\s*12h/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Hard\s*2d/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Good\s*12d/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Easy\s*1\.0mo/})).toBeInTheDocument();
});

test('A new card shows the intervals the backend gives for new cards', async () => {
    const user = userEvent.setup();
    fakeBackend({states: []});
    renderAt();
    await screen.findByText('Front one');

    await user.keyboard(' ');

    expect(screen.getByRole('button', {name: /^Again\s*10m/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Hard\s*1d/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Good\s*1d/})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /^Easy\s*4d/})).toBeInTheDocument();
});

test('Rating a card saves it and moves on to the next card, which starts on its front', async () => {
    const user = userEvent.setup();
    const fetchSpy = fakeBackend();
    renderAt();
    await screen.findByText('Front two');

    await user.click(screen.getByRole('button', {name: 'Show answer'}));
    await user.click(screen.getByRole('button', {name: /^Good/}));

    await waitFor(() => expect(cardText()).toBe('Front one'));
    expect(savedReviews(fetchSpy)).toEqual([{cardId: 'c2', rating: 'good'}]);
    expect(screen.getByText('New 1')).toBeInTheDocument();
    expect(screen.getByText('Due 0')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
});

test('Again puts the card back at the end of the session as a learning card', async () => {
    const user = userEvent.setup();
    const fetchSpy = fakeBackend();
    renderAt();
    await screen.findByText('Front two');

    await user.keyboard(' ');
    await user.click(screen.getByRole('button', {name: /^Again/}));
    await waitFor(() => expect(cardText()).toBe('Front one'));
    expect(screen.getByText('Learn 1')).toBeInTheDocument();

    await user.keyboard(' ');
    await user.keyboard('3'); // Good on the new card
    await waitFor(() => expect(cardText()).toBe('Front two')); // the card that was rated Again is back

    expect(savedReviews(fetchSpy).map((r) => r.rating)).toEqual(['again', 'good']);
});

test('The keyboard flips with space, rates with 1 to 4, and Space on the back means Good', async () => {
    const user = userEvent.setup();
    const fetchSpy = fakeBackend();
    renderAt();
    await screen.findByText('Front two');

    await user.keyboard('3'); // not flipped yet, so nothing is rated
    expect(savedReviews(fetchSpy)).toEqual([]);

    await user.keyboard(' ');
    expect(cardText()).toBe('Back two');
    await user.keyboard('4'); // Easy
    await waitFor(() => expect(cardText()).toBe('Front one'));

    await user.keyboard('{ArrowUp}');
    expect(cardText()).toBe('Back one');
    await user.keyboard(' '); // Good
    await screen.findByText('Session complete!');

    expect(savedReviews(fetchSpy)).toEqual([
        {cardId: 'c2', rating: 'easy'},
        {cardId: 'c1', rating: 'good'},
    ]);
});

test('Finishing the session shows how it went and when the next card is due', async () => {
    const user = userEvent.setup();
    fakeBackend({cards: [card('c1', 'Front one', 'Back one')], states: []});
    renderAt();
    await screen.findByText('Front one');

    await user.keyboard(' ');
    await user.keyboard('3');

    expect(await screen.findByText('Session complete!')).toBeInTheDocument();
    expect(screen.getByText(/1 review · 100% answered without Again/)).toBeInTheDocument();
    expect(screen.getByText('Next card due in 1d.')).toBeInTheDocument();
});

test('When nothing is due and there are no new cards, says so and when the next card is due', async () => {
    fakeBackend({cards: [card('c3', 'Front three', 'Back three')], states: [state('c3', 3, 2)]});
    renderAt();

    expect(await screen.findByText("You're all caught up.")).toBeInTheDocument();
    expect(screen.getByText('Next card due in 2d.')).toBeInTheDocument();
});

test('If a rating cannot be saved, the card stays and the message is shown', async () => {
    const user = userEvent.setup();
    const fetchSpy = fakeBackend({saveStatus: 500});
    renderAt();
    await screen.findByText('Front two');

    await user.keyboard(' ');
    await user.keyboard('3');

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save that review.');
    expect(cardText()).toBe('Back two');
    expect(savedReviews(fetchSpy)).toHaveLength(1);
    expect(screen.getByRole('button', {name: /^Good/})).toBeEnabled(); // it can be tried again
});

test('A deck with no cards says there is nothing to study', async () => {
    fakeBackend({cards: [], states: []});
    renderAt();

    expect(await screen.findByText(/nothing to study/)).toBeInTheDocument();
});

test('Shows an error with a retry button when the cards cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => reply(500, null));
    renderAt();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong (error 500).');
    expect(screen.getByRole('button', {name: 'Try again'})).toBeInTheDocument();
});
