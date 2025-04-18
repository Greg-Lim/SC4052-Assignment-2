import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import { Octokit } from "octokit";
import './SearchPage.css';

function SearchPage() {
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const octokit = new Octokit({ auth: token });

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
    setIssues([]);
  };

  const searchGithubIssues = async (searchParams) => {
    if (!isAuthenticated) {
      setError('Authentication required to search issues');
      return;
    }
    setIsLoading(true);
    setError(null);
    setIssues([]);
    try {
      let queryString = '';
      // queryString += 'label:"good first issue"';
      if (searchParams.language) {
        queryString += ` label:${searchParams.language}`;
      }
      if (searchParams.tag) {
        queryString += ` label:"${searchParams.tag}"`;
      }
      if (searchParams.repoFormat) {
        queryString += ` repo:${searchParams.repoFormat}`;
      }
      queryString += ` state:closed`;
      queryString += ' has:pr';
      const response = await octokit.request('GET /search/issues', {
        q: queryString,
        sort: 'created',
        order: 'desc',
        per_page: 10,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      let issuesWithPrData = await Promise.all(
        response.data.items.map(async (issue) => {
          const urlParts = issue.url.split('/');
          const owner = urlParts[4];
          const repo = urlParts[5];
          const issueNumber = urlParts[7];
          try {
            const prsResponse = await octokit.request('GET /search/issues', {
              q: `repo:${owner}/${repo} is:pr is:merged ${issueNumber}`,
              per_page: 5,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }
            });
            return {
              ...issue,
              associatedPRs: prsResponse.data.items
            };
          } catch (e) {
            return {
              ...issue,
              associatedPRs: []
            };
          }
        })
      );
      issuesWithPrData = issuesWithPrData.filter(issue => 
        issue.associatedPRs && issue.associatedPRs.length > 0
      );
      setIssues(issuesWithPrData);
      return issuesWithPrData;
    } catch (err) {
      setError(err.message || 'An error occurred while searching issues');
      setIssues([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const selectIssue = async (issue) => {
    setIsLoading(true);
    setError(null);
    try {
      const urlParts = issue.url.split('/');
      const owner = urlParts[4];
      const repo = urlParts[5];
      const issueNumber = urlParts[7];
      navigate(`/practice/${owner}/${repo}/${issueNumber}`);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching issue details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-page-container">
      <h1>GitHub Issue Practice Tool</h1>
      {!isAuthenticated ? (
        <div className="auth-container">
          <p>GitHub search requires authentication. Please enter your GitHub token:</p>
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
          <SearchBar onIssueSearch={searchGithubIssues} />
          {isLoading && <p className="loading-message">Searching...</p>}
          {error && <p className="error-message">Error: {error}</p>}
          {!isLoading && !error && issues.length > 0 && (
            <div className="results-container">
              <h2>Practice Issues with Solutions</h2>
              <ul className="issue-list">
                {issues.map(issue => (
                  <li key={issue.id} className="issue-item">
                    <h3>
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                        {issue.title}
                      </a>
                    </h3>
                    <div className="issue-meta">
                      <span className="issue-state closed">
                        🔴 Closed
                      </span>
                      <span className="issue-number">#{issue.number}</span>
                      <span className="issue-repo">
                        in <a href={`https://github.com/${issue.repository_url.split('/').slice(-2).join('/')}`} target="_blank" rel="noopener noreferrer">
                          {issue.repository_url.split('/').slice(-2).join('/')}
                        </a>
                      </span>
                    </div>
                    <div className="issue-labels">
                      {issue.labels && issue.labels.map(label => (
                        <span 
                          key={label.id} 
                          className="issue-label"
                          style={{ 
                            backgroundColor: `#${label.color}`, 
                            color: parseInt(label.color, 16) > 0xffffff/2 ? '#000' : '#fff'
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                    <p className="issue-description">
                      {issue.body ? issue.body.slice(0, 200) + (issue.body.length > 200 ? '...' : '') : 'No description provided.'}
                    </p>
                    <div className="issue-actions">
                      <button 
                        onClick={() => selectIssue(issue)} 
                        className="practice-button"
                      >
                        Practice This Issue
                      </button>
                      <span className="issue-prs">
                        <span className="pr-count">✓ {issue.associatedPRs.length} PR{issue.associatedPRs.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!isLoading && !error && issues.length === 0 && (
            <p className="no-results">No issues found. Try a different search term or repository.</p>
          )}
        </>
      )}
    </div>
  );
}

export default SearchPage;
