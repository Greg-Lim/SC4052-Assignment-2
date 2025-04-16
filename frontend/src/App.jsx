import { useState, useEffect } from 'react'
import './App.css'
import SearchBar from './Components/SearchBar'
import { Octokit } from "octokit";

function App() {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize Octokit with proper authentication
  const octokit = new Octokit({
    auth: token
  });

  // Check for existing token in localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (token.trim()) {
      localStorage.setItem('github_token', token);
      setIsAuthenticated(true);
    }
  };

  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    setToken('');
    setIsAuthenticated(false);
    setRepositories([]);
  };

  const searchGithubRepos = async (searchParams) => {
    if (!isAuthenticated) {
      setError('Authentication required to search code');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build the query string with the filters
      let queryString = searchParams.query;
      
      // Add language filter if provided
      if (searchParams.language) {
        queryString += ` language:${searchParams.language}`;
      }
      
      // Add repository format (user/repo) filter if provided
      if (searchParams.repoFormat) {
        queryString += ` repo:${searchParams.repoFormat}`;
      }
      
      // Use Octokit to search code
      const response = await octokit.request('GET /search/code', {
        q: queryString,
        sort: 'indexed',
        order: 'desc',
        per_page: 10,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      setRepositories(response.data.items);
      return response.data;
    } catch (err) {
      console.error('Error searching repositories:', err);
      setError(err.message || 'An error occurred while searching repositories');
      setRepositories([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>GitHub Code Search</h1>
      
      {!isAuthenticated ? (
        <div className="auth-container">
          <p>GitHub code search requires authentication. Please enter your GitHub token:</p>
          <form onSubmit={handleTokenSubmit} className="token-form">
            <input
              type="password"
              value={token}
              onChange={handleTokenChange}
              placeholder="GitHub Personal Access Token"
              className="token-input"
              required
            />
            <button type="submit" className="token-submit">Authenticate</button>
          </form>
          <div className="token-help">
            <p>You can create a personal access token in your 
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer"> GitHub settings</a>.
              <br />Make sure to include the <code>repo</code> and <code>read:user</code> scopes.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="auth-status">
            <span>✓ Authenticated</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          <SearchBar onSearch={searchGithubRepos} />
          
          {isLoading && <p className="loading-message">Searching code...</p>}
          
          {error && <p className="error-message">Error: {error}</p>}
          
          {!isLoading && !error && repositories.length > 0 && (
            <div className="results-container">
              <h2>Search Results</h2>
              <ul className="repo-list">
                {repositories.map(item => (
                  <li key={item.sha} className="repo-item">
                    <h3>
                      <a href={item.html_url} target="_blank" rel="noopener noreferrer">
                        {item.name}
                      </a>
                    </h3>
                    <p className="repo-description">
                      Repository: <a href={`https://github.com/${item.repository.full_name}`} target="_blank" rel="noopener noreferrer">
                        {item.repository.full_name}
                      </a>
                    </p>
                    <p className="code-path">Path: {item.path}</p>
                    {item.repository.language && <span className="repo-language">{item.repository.language}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!isLoading && !error && repositories.length === 0 && (
            <p className="no-results">No code files found. Try a different search term.</p>
          )}
        </>
      )}
    </div>
  )
}

export default App
