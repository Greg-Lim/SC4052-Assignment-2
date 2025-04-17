import React from "react";
// import OpenAI from 'openai';
import OpenAIKeyAuth from "./OpenAIKeyAuth";
import "./PRReviewPanel.css";

const PRReviewPanel = ({ issue, repoLog, ghAccount }) => {
  const [repoToUse, setRepoToUse] = React.useState(null);
  const [selectedRepo, setSelectedRepo] = React.useState(null);
  const [compareResult, setCompareResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [allHints, setAllHints] = React.useState([]);
  const [hintLoading, setHintLoading] = React.useState(false);
  const [hint, setHint] = React.useState(null);
  const [hintError, setHintError] = React.useState(null);
  const [commitSha, setCommitSha] = React.useState("");

  const originalRepo = `https://github.com/${ghAccount.login}/${issue.repoInfo.name}`;
  const apiKey = localStorage.getItem('openai_api_key');

  async function getHint() {
    setHintLoading(true);
    setHintError(null);
    setHint(null);
    try {
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) throw new Error('No OpenAI API key found.');
      // Create a more structured prompt with relevant file information
      const diffs = compareResult?.files || [];
      const diffSummaries = diffs.map(file => ({
        filename: file.filename,
        patch: file.patch,
        changes: `+${file.additions}/-${file.deletions}`
      }));
      
      const prompt = `Generate a hint for these code changes: ${JSON.stringify(diffSummaries)}`;
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano-2025-04-14',
          messages: [
            { role: 'system', content: 'You are an assistant that gives hints to help the user achieve the code shown in the code diff.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 20
        })
      });
      if (!res.ok) throw new Error('OpenAI API error');
      const data = await res.json();
      setHint(data.choices?.[0]?.message?.content || 'No hint received.');
    } catch (err) {
      setHintError(err.message);
    } finally {
      setHintLoading(false);
    }
  }

  // Safe mapping for diffs
  const diffs = Array.isArray(compareResult?.files)
    ? compareResult.files.map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch,
      }))
    : null;

  // Set repoToUse to originalRepo by default, allow user to change it
  React.useEffect(() => {
    setRepoToUse(originalRepo);
    // eslint-disable-next-line
  }, [originalRepo]);

  return (
    <div className="pr-review-panel-container">
      <h2>PR Review Panel</h2>
      <OpenAIKeyAuth />
      <div className="repo_to_review-container">
        <input
          type="text"
          className="repo-to-review"
          placeholder="Repo to review"
          value={repoToUse || ''}
          onChange={(e) => setRepoToUse(e.target.value)}
          aria-label="Search GitHub issues"
        />
        <div className="repo_to_review-container-second-line">
          <input
            type="text"
            className="repo-sha-to-review"
            placeholder="Commit SHA to compare (default: latest on main)"
            value={commitSha}
            onChange={(e) => setCommitSha(e.target.value)}
          />
          <button
            className="repo-select-button"
            onClick={async () => {
              setSelectedRepo(repoToUse);
              setLoading(true);
              setError(null);
              setCompareResult(null);
              try {
                // Parse owner/repo from repoToUse
                const repoMatch = repoToUse.match(/github.com\/(.+?)\/(.+?)(?:$|\/|\?)/);
                if (!repoMatch) throw new Error('Invalid repo URL');
                const parentOwner = repoMatch[1];
                const parentRepo = repoMatch[2];
                const parentCommitSha = commitSha || 'main';
                const forkOwner = ghAccount.login;
                const forkBranch = `practice-fix-${issue.number}`;
                const url = `https://api.github.com/repos/${parentOwner}/${parentRepo}/compare/${parentCommitSha}...${forkOwner}:${forkBranch}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Failed to fetch compare');
                const data = await res.json();
                setCompareResult(data);
              } catch (err) {
                setError(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={!repoToUse || loading}
          >
            Compare
          </button>
        </div>
      </div>
      {loading && <p>Loading comparison...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {
        diffs && (
          <div>
            <button className="generate-hint-button"
              onClick={getHint}
              disabled={hintLoading}
            >
              {hintLoading ? 'Generating Hint...' : 'Generate Hint'}
            </button>
            {hintError && <div style={{color: 'red', marginTop: 8}}>{hintError}</div>}
            {hint && <div style={{marginTop: 8, background: '#fffbdd', padding: 8, borderRadius: 4}}>{hint}</div>}
          </div>
        )
      }
    </div>
  );
};

export default PRReviewPanel;
