import { useSearchParams } from 'react-router-dom';
import NotBuiltPage from './NotBuiltPage';

// PSEUDO PATH for the header search: /search?q=text. The backend has no search yet,
// so this only shows what was typed. TODO: call the real search and list results here.
export default function SearchPage() {
  const [params] = useSearchParams();
  const text = params.get('q') ?? '';

  return (
    <NotBuiltPage
      title="Search"
      message={`Search for "${text}" isn't connected to the backend yet.`}
    />
  );
}
