import { useState } from 'react';
import './SearchBar.css';

const SearchBar = ({ onIssueSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [repoFormat, setRepoFormat] = useState('');
  const [tag, setTag] = useState('good first issue');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Call the onIssueSearch prop with the query and filters
    // Always search for closed issues with PRs
    onIssueSearch({
      query: searchQuery.trim(),
      language: language.trim(),
      repoFormat: repoFormat.trim(),
      tag: tag.trim(),
      state: 'closed',
      practiceMode: true // Always true to only show issues with PRs
    })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Popular programming languages for the dropdown with their file extension mappings
  const languageMappings = {
    'JavaScript': ['js', 'jsx', 'ts', 'tsx'],
    'Python': ['py', 'python'],
    'Java': ['java'],
    'TypeScript': ['ts', 'tsx'],
    'C#': ['cs', 'csharp'],
    'PHP': ['php'],
    'C++': ['cpp', 'cc', 'cxx', 'h', 'hpp'],
    'Ruby': ['rb'],
    'Go': ['go'],
    'Swift': ['swift']
  };

  // Extract language names for the dropdown
  const languageNames = Object.keys(languageMappings);

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="fixed-search-section">
          <div className="search-header">
            <h2>Search for Issues to Practice Fixing</h2>
            <p className="search-description">Find closed issues with pull requests to practice your coding skills</p>
          </div>
          
          <div className="main-search-row">
            <input
              type="text"
              className="search-input"
              placeholder="Search GitHub issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search GitHub issues"
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading} // Only disable when loading
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
                {languageNames.map(lang => (
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

            <div className="filter-group">
              <label htmlFor="tag-input" className="filter-label">Tag:</label>
              <input
                type="text"
                id="tag-input"
                className="filter-input"
                placeholder="Enter a tag (e.g., bug, enhancement)"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;