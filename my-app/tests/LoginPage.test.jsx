import {render, screen} from '@testing-library/react';
import LoginPage from '../src/pages/LoginPage';

test('Login page shows the heading, both fields, and the Log in button.', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', {name: 'Log in'})).toBeInTheDocument();
    expect(screen.getByLabelText('Email or username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Log in'})).toBeInTheDocument();
}
