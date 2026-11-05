import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {vi, afterEach} from 'vitest';
import SignupPage from '../src/pages/SignupPage';

// puts real fetch back after every test
afterEach(() => {
  vi.restoreAllMocks();
});



//happy path test
// the page shows everything a person needs to sign up
test('signup page shows the heading, all four fields, and the Create account button', () => {
  render(<SignupPage />);

  //expects text boxes to be named the correct names
  expect(screen.getByRole('heading', { name: 'Create account' })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
  expect(screen.getByLabelText('Username')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();

  //submit button exists
  expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
});



//edge case test
//the server rejects one field, and the message appears by that field
test('a server validation error appears under the password field', async () => {
  const user = userEvent.setup();

  //replaces the real fetch with a fake so the real server isn't used
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    //contains a list of problems. Says what field and what is wrong
    json: async () => ({
      detail: [
        {
          //the last item in loc names the field "password"
          loc: ['body', 'password'],
          //the page strips the "Value error, " prefix before showing this message.
          msg: 'Value error, Password must contain an uppercase letter',
        },
      ],
    }),
  });

  render(<SignupPage />);

  await user.type(screen.getByLabelText('Email'), 'user@example.com');
  await user.type(screen.getByLabelText('Name'), 'Fred');
  await user.type(screen.getByLabelText('Username'), 'fred4');
  //fill in the Password box with a password that has no uppercase letter.
  await user.type(screen.getByLabelText('Password'), 'str0ng!pass');
  await user.click(screen.getByRole('button', {name: 'Create account'}));

  expect(
    await screen.findByText('Password must contain an uppercase letter')
  ).toBeInTheDocument();
  //this should NOT appear bc the account should not have been created
  expect(screen.queryByText('Account created')).not.toBeInTheDocument();
});



//happy path test
//a successful signup shows the "Account created" screen
test('a successful signup shows "Account created"', async () => {
  const user = userEvent.setup();
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    // ok: true means the request succeeded.
    ok: true,
    json: async () => ({}),
  });

  render(<SignupPage />);

  await user.type(screen.getByLabelText('Email'), 'fred@example.com');
  await user.type(screen.getByLabelText('Name'), 'Fred');
  await user.type(screen.getByLabelText('Username'), 'fred4');
  await user.type(screen.getByLabelText('Password'), 'Str0ng!Pass');
  // Click the submit button.
  await user.click(screen.getByRole('button', {name: 'Create account'}));

  //wait for the success screen's heading to appear, and expects text and button
  expect(await screen.findByRole('heading', { name:'Account created'})).toBeInTheDocument();
  expect(screen.getByText('You can log in now.')).toBeInTheDocument();
  expect(screen.getByRole('button', {name: 'Go to log in'})).toBeInTheDocument();
});