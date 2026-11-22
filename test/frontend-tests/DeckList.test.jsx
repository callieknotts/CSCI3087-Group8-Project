import {render, screen} from '@testing-library/react';
import DeckList from '../../my-app/src/components/DeckList';
import userEvent from '@testing-library/user-event';
import {vi, afterEach, test, expect} from 'vitest';

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// builds a fake server reply shaped like Dylan's backend replies
function reply(status, body) {
    return {ok: status >= 200 && status < 300, status, json: async () => body};
}

// happy path: decks from the server are shown
test('Deck list shows the decks returned by the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        reply(200, [{id: 1, deckname: 'Biology', description: 'Cells'}])
    );

    render(<DeckList onUnauthorized={() => {}} />);

    expect(await screen.findByRole('heading', {name: 'Biology'})).toBeInTheDocument();
    expect(screen.getByText('Cells')).toBeInTheDocument();
});

// empty state: no decks yet
test('Deck list shows a friendly message when there are no decks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(200, []));

    render(<DeckList onUnauthorized={() => {}} />);

    expect(await screen.findByText(/don't have any decks yet/i)).toBeInTheDocument();
});

// the front end blocks an empty name before calling the backend
test('Adding a deck with no name shows an error and sends nothing', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(200, []));

    render(<DeckList onUnauthorized={() => {}} />);
    await screen.findByText(/don't have any decks yet/i);

    await user.click(screen.getByRole('button', {name: 'Add deck'}));

    expect(screen.getByText('Deck name is required.')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1); // only the initial list request
});

// backend says the session expired: the app is told to go back to login
test('A 401 from the server calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(reply(401, {detail: 'Not authenticated'}));

    render(<DeckList onUnauthorized={onUnauthorized} />);

    await vi.waitFor(() => expect(onUnauthorized).toHaveBeenCalled());
});
