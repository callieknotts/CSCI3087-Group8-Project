import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';
import Layout from '../../my-app/src/components/Layout';
import {vi, afterEach, test, expect} from 'vitest';

// undoes fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreAllMocks();
});

// shows the current address so a test can check where a click went
function Where() {
    const location = useLocation();
    return <p data-testid="where">{location.pathname + location.search}</p>;
}

// renders the header inside the Layout, the way App does after login
function renderLayout(onLogout = () => {}) {
    return render(
        <MemoryRouter initialEntries={['/somewhere']}>
            <Routes>
                <Route element={<Layout user={{name: 'Fred'}} onLogout={onLogout} />}>
                    <Route path="*" element={<Where />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );
}

// the profile menu starts closed and opens on click
test('Profile menu shows Profile and Logout when clicked', async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', {name: 'Profile menu'}));

    expect(screen.getByRole('link', {name: 'Profile'})).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('button', {name: 'Logout'})).toBeInTheDocument();
});

// the house button and the + button link to their pages
test('Home and + buttons link to the homepage and the manage page', () => {
    renderLayout();

    expect(screen.getByRole('link', {name: 'Back to homepage'})).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', {name: 'Create deck'})).toHaveAttribute('href', '/manage');
});

// pseudo search path: submitting goes to /search?q=text
test('Searching in the header goes to the search path', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.type(screen.getByRole('searchbox', {name: 'Search'}), 'biology{Enter}');

    expect(screen.getByTestId('where')).toHaveTextContent('/search?q=biology');
});

// Logout uses the real logout request, then tells the app
test('Logout sends the logout request and calls onLogout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ok: true, status: 200});
    renderLayout(onLogout);

    await user.click(screen.getByRole('button', {name: 'Profile menu'}));
    await user.click(screen.getByRole('button', {name: 'Logout'}));

    expect(fetchSpy).toHaveBeenCalledWith('/api/users/logout', {
        method: 'DELETE',
        credentials: 'include',
    });
    expect(onLogout).toHaveBeenCalled();
});

// a failed logout stays logged in and shows a message
test('A failed logout shows an error and does not call onLogout', async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ok: false, status: 500});
    renderLayout(onLogout);

    await user.click(screen.getByRole('button', {name: 'Profile menu'}));
    await user.click(screen.getByRole('button', {name: 'Logout'}));

    expect(await screen.findByText('Could not log out. Try again.')).toBeInTheDocument();
    expect(onLogout).not.toHaveBeenCalled();
});
