import Button from '../components/Button';
import DeckList from '../components/DeckList';
import './LoginPage.css';
import './HomePage.css';
import './DecksPage.css';

// The "Your decks" screen. Opened from the home page; "Back to home" returns.
export default function DecksPage({ user, onBack, onLogout }) {
  return (
    <main className="login-page home-page decks-page">
      <header className="top-bar">
        <Button variant="type2" onClick={onBack}>
          ← Back to home
        </Button>
        <div className="user-badge">
          <span className="user-badge__name">{user.name}</span>
        </div>
      </header>

      <div className="home-content">
        <h2 className="app-title">Rebel Review</h2>
        <h1>Your decks</h1>

        {/* If the server says the session ended, treat it like a logout. */}
        <DeckList onUnauthorized={onLogout} />
      </div>
    </main>
  );
}
