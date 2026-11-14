import { Link } from 'react-router-dom';
import { paths } from '../routes';

// Stands in for pages that have a path but are not built yet (profile, a single deck,
// a single subdeck) and for addresses that don't exist. Replace each route in App.jsx
// with the real page when it is ready.
export default function NotBuiltPage({ title, message = "This page hasn't been built yet." }) {
  return (
    <main style={{ padding: '2rem 1rem' }}>
      <h1>{title}</h1>
      <p>{message}</p>
      <p style={{ marginTop: '1rem' }}>
        <Link to={paths.home}>Back to the library</Link>
      </p>
    </main>
  );
}
