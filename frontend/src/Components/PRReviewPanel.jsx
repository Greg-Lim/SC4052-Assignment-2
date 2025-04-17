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
  const [hintLoading, setHintLoading] = React.useState([]);

  const originalRepo = `https://github.com/${ghAccount.login}/${issue.repoInfo.name}`;

  function getHint() {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `Generate a hint for the following code changes:\n\n${compareResult?.files.map(file => file.patch).join('\n\n')}`;
    return openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    
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
        <button
          className="repo-select-button"
          onClick={async () => {
            setSelectedRepo(repoToUse);
            setLoading(true);
            setError(null);
            setCompareResult(null);
            try {
              // Updated: Compare parent commit with forked branch
              const parentOwner = issue.repoInfo.owner;
              const parentRepo = issue.repoInfo.name;
              const parentCommitSha = repoLog.parents[0]?.sha;
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
      {loading && <p>Loading comparison...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {
        diffs && (
          <div>
            {/* Placeholder for diff display */}
            <button className="generate-hint-button">Generate Hint</button>
          </div>
        )
      }
    </div>
  );
};

export default PRReviewPanel;
