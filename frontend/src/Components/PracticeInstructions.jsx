import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import './PracticeInstructions.css';

const PracticeInstructions = ({ issue, repoLog, ghAccount }) => {
  const navigate = useNavigate();
  const [showFiles, setShowFiles] = useState(false);
  if (!issue || !issue.repoInfo) return null;
  const beforeCommitSha = repoLog.parents[0]?.sha;
  const afterCommitSha = issue.prDetails?.merge_commit_sha;
  const [withAIReview, setWithAIReview] = useState(true);

  return (
    <div className="selected-issue-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div className="issue-header">
        <h2>
          <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
            {issue.title}
          </a>
        </h2>
        <div className="issue-meta">
          <span className="issue-state closed">🔴 Closed</span>
          <span className="issue-number">#{issue.number}</span>
          <span className="issue-repo">
            in <a href={`https://github.com/${issue.repoInfo.fullName}`} target="_blank" rel="noopener noreferrer">
              {issue.repoInfo.fullName}
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
                color: parseInt(label.color, 16) > 0xffffff / 2 ? '#000' : '#fff'
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>
      <div className="issue-body">
        <h3>Issue Description</h3>
        <div className="markdown-body markdown-content">
          <ReactMarkdown>
            {issue.body || 'No description provided.'}
          </ReactMarkdown>
        </div>
      </div>
      {issue.comments && issue.comments.length > 0 && (
        <div className="issue-comments">
          <h3>Comments</h3>
          <ul className="comments-list">
            {issue.comments.map(comment => (
              <li key={comment.id} className="comment-item">
                <div className="comment-header">
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.login}
                    className="commenter-avatar"
                  />
                  <span className="commenter-name">{comment.user.login}</span>
                  <span className="comment-date">
                    on {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="comment-body markdown-content">
                  <ReactMarkdown>
                    {comment.body}
                  </ReactMarkdown>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {issue.associatedPRs && issue.associatedPRs.length > 0 && (
        <div className="associated-prs">
          <h3>Associated Pull Requests</h3>
          <ul className="pr-list">
            {issue.associatedPRs.map(pr => (
              <li key={pr.id} className="pr-item">
                <h4>
                  <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                    {pr.title}
                  </a>
                </h4>
                <div className="pr-meta">
                  <span className="pr-state merged">🟣 Merged</span>
                  <span className="pr-number">#{pr.number}</span>
                </div>
                <p className="pr-description">
                  <ReactMarkdown>
                    {pr.body ? pr.body.slice(0, 200) + (pr.body.length > 200 ? '...' : '') : 'No description provided.'}
                  </ReactMarkdown>
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="practice-instructions">
        <h3>Practice Instructions</h3>
        <div className="ai-review-option">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={withAIReview}
              onChange={() => setWithAIReview(prev => !prev)} 
            />
            <span className="checkbox-label">Use AI review for my solution</span>
          </label>
          {withAIReview && (
            <div className="ai-review-instructions">
              <p>With AI review enabled, you will create a fork of the repository . The AI will review your code and provide feedback.</p>
            </div>
          )}
        </div>
        <p>Follow these steps to practice solving this issue:</p>
        <ol className="instructions-list">
          <li>
            <strong>Fork the repository:</strong>
            <p>This step is optional only if you want AI review</p>
            <p> Go to <a href={`https://github.com/${issue.repoInfo.fullName}`} target="_blank" rel="noopener noreferrer">https://github.com/{issue.repoInfo.fullName}</a> and click the <b>Fork</b> button at the top right.</p>
          </li>
          <li>
            <strong>Clone the repository:</strong>
            <pre className="code-block">
              {
                withAIReview ? (
                  <code>
                    git clone https://github.com/{ghAccount.login}/{issue.repoInfo.name}.git
                  </code>
                ) : (
                  <code>git clone https://github.com/{issue.repoInfo.fullName}.git</code>
                )
              }
              
            </pre>
          </li>
          <li>
            <strong>Navigate to the project:</strong>
            <pre className="code-block">
              <code>cd {issue.repoInfo.name}</code>
            </pre>
          </li>
          {beforeCommitSha && (
            <li>
              <strong>Checkout the commit before the fix:</strong>
              <pre className="code-block">
                <code>git checkout {beforeCommitSha}</code>
              </pre>
            </li>
          )}
          <li>
            <strong>Create a new branch for your fix:</strong>
            <pre className="code-block">
              <code>git checkout -b practice-fix-{issue.number}</code>
            </pre>
          </li>
          {issue.filesChanged && issue.filesChanged.length > 0 && (
            <li>
              <strong>Files you should examine:</strong>
              <button
                type="button"
                className="toggle-files-btn"
                onClick={() => setShowFiles((prev) => !prev)}
                style={{ marginLeft: 8, marginBottom: 4 }}
              >
                {showFiles ? "Hide files" : "Show files"}
              </button>
              {showFiles && (
                <ul className="files-list">
                  {issue.filesChanged.map((file, index) => (
                    <li key={index} className="file-item">
                      <code>{file.filename}</code>
                      <span className="file-changes">
                        {file.additions > 0 && <span className="additions">+{file.additions}</span>}
                        {file.deletions > 0 && <span className="deletions">-{file.deletions}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}
          <li>
            <strong>Try to fix the issue yourself based on the description.</strong>
          </li>
          {
            withAIReview && (
              <li>
                <strong>Once you have a solution, use the AI review tool to get feedback:</strong>
                <p>Run our AI review command to analyze your code:</p>
              </li>
            )
          }

          {afterCommitSha && (
            <li>
              <strong>After attempting your fix, compare with the actual solution:</strong>
              {/* <p>Compare your code to the actual code change</p>
              <pre className="code-block">
                <code>git checkout {afterCommitSha}</code>
              </pre> */}
              <p>Compare you code with the actual PR fix</p>
              <pre className="code-block">
                <code>git diff {afterCommitSha} HEAD</code>
              </pre>
            </li>
          )}
        </ol>
        <div className="practice-hints">
          <h4>Hints:</h4>
          <ul>
            {issue.commitsInPR && issue.commitsInPR.length > 0 && (
              <li>
                The issue was fixed in {issue.commitsInPR.length} commit(s).
                {issue.commitsInPR.length === 1
                  ? ` Commit message: "${issue.commitsInPR[0].commit.message}"`
                  : ` First commit message: "${issue.commitsInPR[0].commit.message}"`}
              </li>
            )}
            {issue.filesChanged && issue.filesChanged.length > 0 && (
              <li>
                The solution involved changing {issue.filesChanged.length} file(s)
                with {issue.filesChanged.reduce((sum, file) => sum + file.additions, 0)} additions
                and {issue.filesChanged.reduce((sum, file) => sum + file.deletions, 0)} deletions.
              </li>
            )}
            {issue.comments && issue.comments.length > 0 && (
              <li>
                Check the issue comments for additional context and discussions about the solution.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PracticeInstructions;
