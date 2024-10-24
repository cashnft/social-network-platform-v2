import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchAPI } from '../api';
import useDebounce from '../hooks/useDebounce';

function SearchBar() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  React.useEffect(() => {
    if (debouncedQuery) {
      searchResults();
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const searchResults = async () => {
    try {
      setIsLoading(true);
      const [users, tweets] = await Promise.all([
        searchAPI.searchUsers(debouncedQuery),
        searchAPI.searchTweets(debouncedQuery)
      ]);
      setResults([...users, ...tweets]);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (result) => {
    setIsOpen(false);
    setQuery('');
    if (result.type === 'user') {
      navigate(`/profile/${result.username}`);
    } else {
      navigate(`/tweet/${result.id}`);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Search Chirper"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isOpen && (query || isLoading) && (
        <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                className="w-full p-4 text-left hover:bg-gray-50 flex items-center"
              >
                {result.type === 'user' ? (
                  <>
                    <img
                      src={result.avatar || '/default-avatar.png'}
                      alt={result.username}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-500">@{result.username}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col">
                    <div className="font-medium">{result.author.name}</div>
                    <div className="text-sm text-gray-500">{result.content}</div>
                  </div>
                )}
              </button>
            ))
          ) : query ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default SearchBar;