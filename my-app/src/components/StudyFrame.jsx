import { Link } from 'react-router-dom';
import '../pages/FlashcardPage.css'; // page layout, title, card and star styles shared with Classic mode
import './StudyModes.css';

// The frame every extra study mode sits in: back link, deck name, the mode's name with its
// tools (Shuffle) on the same row, and a message if a star could not be saved.
export default function StudyFrame({ backTo, backLabel, title, modeName, tools, error, children }) {
  return (
    <main className="flash study">
      <Link className="flash-back" to={backTo}>
        ← {backLabel}
      </Link>
      <h1 className="flash-title">{title}</h1>
      <div className="study-bar">
        <span className="study-mode">{modeName}</span>
        {tools}
      </div>
      {error && (
        <p className="flash-message" role="alert">
          {error}
        </p>
      )}
      {children}
    </main>
  );
}
