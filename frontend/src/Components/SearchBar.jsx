import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [repoFormat, setRepoFormat] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Call the onSearch prop with the current query and filters
    onSearch({
      query: searchQuery.trim(),
      language: language.trim(),
      repoFormat: repoFormat.trim()
    })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Popular programming languages for the dropdown
  const popularLanguages = [
    'JavaScript', 'Python', 'Java', 'TypeScript', 
    'C#', 'PHP', 'C++', 'Ruby', 'Go', 'Swift'
  ];

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="fixed-search-section">
          <div className="main-search-row">
            <input
              type="text"
              className="search-input"
              placeholder="Search GitHub code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search GitHub code"
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="advanced-options-toggle">
            <button 
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="toggle-button"
            >
              {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
            </button>
          </div>
        </div>
        
        <div className={`advanced-options ${!showAdvanced ? 'hidden' : ''}`}>
          <div className="filter-row">
            <div className="filter-group">
              <label htmlFor="language-select" className="filter-label">Programming Language:</label>
              <select 
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="filter-select"
              >
                <option value="">Any Language</option>
                {popularLanguages.map(lang => (
                  <option key={lang} value={lang.toLowerCase()}>{lang}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="repo-format" className="filter-label">Repository:</label>
              <div className="repo-input-container">
                <input
                  type="text"
                  id="repo-format"
                  className="filter-input"
                  placeholder="user/project (e.g., facebook/react)"
                  value={repoFormat}
                  onChange={(e) => setRepoFormat(e.target.value)}
                />
                <button 
                  type="button" 
                  className="quick-select-repo"
                  onClick={() => setRepoFormat("Greg-Lim/SC4052-Assignment-2")}
                  title="Use this repository"
                >
                  Use Greg-Lim/SC4052-Assignment-2
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;