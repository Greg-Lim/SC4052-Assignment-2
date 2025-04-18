import React, { use, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import {parseDiff, Diff, Hunk} from 'react-diff-view';
import OpenAIKeyAuth from "./OpenAIKeyAuth";
import "./PRReviewPanel.css";

const PRReviewPanel = ({ issue, repoLog, ghAccount }) => {
  const [repoToUse, setRepoToUse] = React.useState(null);
  const [selectedRepo, setSelectedRepo] = React.useState(null);
  const [compareResult, setCompareResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [allHints, setAllHints] = React.useState([]);
  const [hint, setHint] = React.useState(null);
  const [hintError, setHintError] = React.useState(null);
  const [commitSha, setCommitSha] = React.useState("");
  const [reviewResult, setReviewResult] = React.useState(null);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [reviewError, setReviewError] = React.useState(null);
  const [ latestCommitShaOnFork, setLatestCommitShaOnFork ] = React.useState(null);

  const forkBranch = `practice-fix-${issue.number}`;
  
  useEffect(() => {
    const fetchLatestCommitSha = async () => {
      try {
        if (!ghAccount || !issue.repoInfo || !issue.repoInfo.name) return;
        
        const forkOwner = ghAccount.login;
        const repoName = issue.repoInfo.name;
        
        // Fetch the latest commit on the branch
        const url = `https://api.github.com/repos/${forkOwner}/${repoName}/branches/${forkBranch}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          // Branch might not exist yet, which is fine
          console.log(`Branch ${forkBranch} not found or not accessible`);
          setLatestCommitShaOnFork(null);
          return;
        }
        
        const data = await response.json();
        const latestSha = data.commit?.sha;
        
        if (latestSha) {
          setLatestCommitShaOnFork(latestSha);
          // If commitSha is empty, we can set it to the latest commit
          if (!commitSha) {
            setCommitSha(latestSha);
          }
        }
      } catch (err) {
        console.error("Error fetching latest commit SHA:", err);
      }
    };

    fetchLatestCommitSha();
  },[forkBranch, ghAccount, issue.repoInfo]);

  const originalRepo = `https://github.com/${ghAccount.login}/${issue.repoInfo.name}`;
  const apiKey = localStorage.getItem('openai_api_key');

  async function getHint() {
    setAllHints(prevHints => [...prevHints, "loading..."]);
    try {
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) throw new Error('No OpenAI API key found.');
      const diffs = compareResult?.files || [];
      const diffSummaries = diffs.map(file => ({
        filename: file.filename,
        patch: file.patch,
        changes: `+${file.additions}/-${file.deletions}`
      }));
      
      const prompt = `
    ${allHints.length === 0 
      ? 'You are generating the first hint, keep it vague and simple.' 
      : allHints.length === 1 
        ? 'You are generating the second hint, be more specific.' 
        : 'You are generating the third hint, be very specific and helpful.'
    }

    Here are the previous hints you have generated:
    ${allHints.slice(0, -1).map((hint, index) => `Hint ${index + 1}: ${hint}`).join('\n')}
    Ensure that the new hint is different and more specific than the previous ones.

    Here is the context of the PR:
    ${issue.body || 'No context provided.'}

    Generate a 1 short sentance hint for these code changes:
    ${JSON.stringify(diffSummaries, null, 2)}

    Keep the sentence less than 20 words and make it a hint, not a solution.
    `;
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
          max_tokens: 60
        })
      });
      if (!res.ok) throw new Error('OpenAI API error');
      const data = await res.json();
      let newHint = data.choices?.[0]?.message?.content || 'No hint received.';
      newHint = newHint.split(".")[0];
      setAllHints(prevHints => [...prevHints.slice(0, -1), newHint]);
    } catch (err) {
      setHintError(err.message);
    }
  }

  async function checkAnswer() {
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);

    try {
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) throw new Error('No OpenAI API key found.');
      
      const diffs = compareResult?.files || [];
      const diffSummaries = diffs.map(file => ({
        filename: file.filename,
        patch: file.patch,
        changes: `+${file.additions}/-${file.deletions}`
      }));
      
      const prompt = `
      You are a code reviewer analyzing the code diff of the actual PR solution and a solution I am working on. Please review the following code changes:
      
      PR Context:
      ${issue.body || 'No context provided.'}
      
      Code Changes:
      ${JSON.stringify(diffSummaries, null, 2)}
      
      Provide a detailed review with:
      1. An overall assessment (2-3 sentences)
      2. Specific feedback on what's good and what could be improved
      3. Suggestions for improvement referencing the original code
      
      Keep your response focused on constructive feedback that helps the user learn.
      Keep the repose short and concise, less than 100 words.
      `;
      
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano-2025-04-14',
          messages: [
            { role: 'system', content: 'You are an expert code reviewer who provides constructive feedback without giving away complete solutions.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 800
        })
      });
      
      if (!res.ok) throw new Error('OpenAI API error');
      const data = await res.json();
      const review = data.choices?.[0]?.message?.content || 'No review received.';
      
      setReviewResult({ review });
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
  }

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

  React.useEffect(() => {
    setRepoToUse(originalRepo);
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
            placeholder="Commit SHA of fork repo (default: latest on main)"
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
                const repoMatch = repoToUse.match(/github.com\/(.+?)\/(.+?)(?:$|\/|\?)/);
                if (!repoMatch) throw new Error('Invalid repo URL');
                const head_owner = repoMatch[1];
                const parentRepo = repoMatch[2];
                const forkOwner = ghAccount.login;
                const forkBranch = `practice-fix-${issue.number}`;
                const base_owner = issue.repoInfo.owner;
                // /repos/{base_owner}/{repo}/compare/{base_sha}...{head_owner}:{head_sha}
                const url = `https://api.github.com/repos/${base_owner}/${parentRepo}/compare/${issue.prDetails?.merge_commit_sha}...${head_owner}:${latestCommitShaOnFork}`;
                // const url = `https://api.github.com/repos/${parentOwner}/${parentRepo}/compare/${parentCommitSha}...${forkOwner}:${forkBranch}`;
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
              disabled={allHints[allHints.length - 1] === "loading..."}
            >
              {allHints[allHints.length - 1] === "loading..." ? 'Generating Hint...' : 'Generate Hint'}
            </button>
            {allHints.map((hintText, index) => (
              <div key={index} className="hint-container">
                <h3>Hint {index + 1}</h3>
                <p>{hintText}</p>
              </div>
            ))}

            <button 
              className="check-answer-button"
              onClick={checkAnswer}
              disabled={reviewLoading}
            >
              {reviewLoading ? 'Checking Answer...' : 'Check Answer'}
            </button>

            {reviewError && (
              <div className="error-message" style={{color: 'red', marginTop: '1rem'}}>
                Error: {reviewError}
              </div>
            )}

            {reviewResult && (
              <div className="review-container">
                <div className="review-section">
                  <h3>Code Review</h3>
                  <div className="review-content markdown-content">
                    <ReactMarkdown>
                      {reviewResult.review}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      }
    </div>
  );
};

export default PRReviewPanel;
