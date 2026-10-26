import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
 
export default function App() {
  const [page, setPage] = useState('login'); // 'login' | 'signup'
 
  return page === 'login' ? (
    <LoginPage onSwitchToSignup={() => setPage('signup')} />
  ) : (
    <SignupPage onSwitchToLogin={() => setPage('login')} />
  );
}
 