// bring in the tool that reads the address's "?q=..." part, and the placeholder page
import { useSearchParams } from 'react-router-dom';
import NotBuiltPage from './NotBuiltPage';

// PSEUDO PATH for the header search: /search?q=text. The backend has no search yet,
// so this only shows what was typed. TODO: call the real search and list results here.
export default function SearchPage() {
  // read the typed search text from the address (for example "?q=biology");
  // if there isn't any, use an empty string
  const [params] = useSearchParams();
  const text = params.get('q') ?? '';

  // show the placeholder page with the typed text inside its message
  return (
    <NotBuiltPage
      title="Search"
      message={`Search for "${text}" isn't connected to the backend yet.`}
    />
  );
}
