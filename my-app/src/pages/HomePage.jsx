import './LoginPage.css';
import './HomePage.css';
//need to add logout here later
export default function HomePage({ user }) {
  return (
    <main className="login-page home-page">
      <header className="top-bar">
        <div className="user-badge">
          <span className="user-badge__name">{user.name}</span>
          <svg
            className="user-badge__icon"
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3.2" />
            <path d="M5.6 18.4c1.6-2.4 3.9-3.6 6.4-3.6s4.8 1.2 6.4 3.6" />
          </svg>
        </div>
      </header>
 
      <div className="login-form">
        <h2 className="app-title">Rebel Review</h2>
 
        <h1>Welcome, {user.name}</h1>
        <p>You're logged in as {user.username}.</p>
      </div>
    </main>
  );
}
