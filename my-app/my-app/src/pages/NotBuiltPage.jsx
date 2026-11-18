// bring in the router's link and the shared page addresses
import { Link } from 'react-router-dom';
import { paths } from '../routes';

// Stands in for pages that have a path but are not built yet (profile, a single deck,
// a single subdeck) and for addresses that don't exist. Replace each route in App.jsx
// with the real page when it is ready.
// It takes a title and an optional message (the message has a default).
export default function NotBuiltPage({ title, message = "This page hasn't been built yet." }) {
  return (
    // the page's main area, with some space around it
    <main style={{ padding: '2rem 1rem' }}>
      {/* the heading and the message under it */}
      <h1>{title}</h1>
      <p>{message}</p>

      {/* a link that takes the user back to the Library homepage */}
      <p style={{ marginTop: '1rem' }}>
        <Link to={paths.home}>Back to the library</Link>
      </p>
    </main>
  );
}
