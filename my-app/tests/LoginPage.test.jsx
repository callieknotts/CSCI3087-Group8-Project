import {render, screen} from '@testing-library/react';
import LoginPage from '../src/pages/LoginPage';
import userEvent from '@testing-library/user-event';
import {vi, afterEach} from 'vitest';

//undos fake fetches so tests don't affect each other
afterEach(() => {
    vi.restoreallMocks();    
});

test('Login page shows the heading, both fields, and the Log in button.', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', {name: 'Log in'})).toBeInTheDocument();
    expect(screen.getByLabelText('Email or username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Log in'})).toBeInTheDocument();
});


test('Typing in the fields updates what is shown in the text boxes.', async () => {      //async bc the test uses await
    const user = userEvent.setup();
    render(<LoginPage />);

    //acts like a user, typing in the 'Email or username' box and the 
    //'Password' box
    await user.type(screen.getByLabelText('Email or username'), 'myUser4');
    await user.type(screen.getByLabelText('Password'), 'MyPassword#!');

    //expects the boxes to have the values that were typed in the boxes above
    expect(screen.getByLabelText('Email or username')).toHaveValue('myUser4');
    expect(screen.getByLabelText('Password')).toHaveValue('MyPassword#!');
});

//Wrong password is used and the server throws an error message
test('Wrong password shows the error message from the server', async () => {      //async bc the test uses await
  const user = userEvent.setup();

  //Fakes the backend. the login request comes back as 401 with a message.
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: false,
    json: async () => ({detail: 'Invalid credentials'}),
  });
  render(<LoginPage />);

  await user.type(screen.getByLabelText('Email or username'), 'myUser4');
  await user.type(screen.getByLabelText('Password'), 'WrongPassword#!');
  //user clicks the Log in button
  await user.click(screen.getByRole('button', {name: 'Log in'}));

  //expects an error
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
});

//Fakes a network failure
test('Unreachable server shows "Could not reach the server"', async () => {   //async bc the test uses await
  const user = userEvent.setup();

  //Fakes a network failure. Makes it fail with an error instead of returning a response.
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));
  render(<LoginPage />);

  await user.type(screen.getByLabelText('Email or username'), 'myUser4');
  await user.type(screen.getByLabelText('Password'), 'MyPassword#!');
  await user.click(screen.getByRole('button', {name: 'Log in'})).

  //expects an error banner to appear 
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not reach the server. Try again.'
  );
});
