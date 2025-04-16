import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Octokit } from "octokit";
import PracticeInstructions from "./PracticeInstructions";

const StandalonePracticeInstructionsPage = () => {
  const { owner, repo, issueId } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("github_token");
        const octokit = new Octokit({ auth: token });
        // Fetch issue by id
        const issueResp = await octokit.request(
          "GET /repos/{owner}/{repo}/issues/{issue_id}",
          { owner, repo, issue_id: issueId }
        );
        const issueData = issueResp.data;
        // Fetch comments
        const commentsResp = await octokit.request(
          "GET /repos/{owner}/{repo}/issues/{issue_id}/comments",
          { owner, repo, issue_id: issueId }
        );
        // Find associated PRs (search for PRs that close this issue)
        const prsResp = await octokit.request(
          "GET /search/issues",
          {
            q: `repo:${owner}/${repo} is:pr is:merged ${issueId}`,
            per_page: 5,
          }
        );
        let prDetails = null;
        let filesChanged = [];
        let commitsInPR = [];
        if (prsResp.data.items.length > 0) {
          const prUrl = prsResp.data.items[0].pull_request.url;
          const prNumber = prUrl.split("/").pop();
          // PR details
          const prResp = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}",
            { owner, repo, pull_number: prNumber }
          );
          prDetails = prResp.data;
          // Files changed
          const filesResp = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
            { owner, repo, pull_number: prNumber }
          );
          filesChanged = filesResp.data;
          // Commits in PR
          const commitsResp = await octokit.request(
            "GET /repos/{owner}/{repo}/pulls/{pull_number}/commits",
            { owner, repo, pull_number: prNumber }
          );
          commitsInPR = commitsResp.data;
        }
        setIssue({
          ...issueData,
          comments: commentsResp.data,
          associatedPRs: prsResp.data.items,
          prDetails,
          filesChanged,
          commitsInPR,
          repoInfo: {
            owner,
            name: repo,
            fullName: `${owner}/${repo}`,
          },
        });
      } catch (err) {
        setError(err.message || "Failed to load issue data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [owner, repo, issueId]);

  if (loading) return <div className="loading-message">Loading practice instructions...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!issue) return null;
  return <PracticeInstructions issue={issue} onClose={() => navigate(-1)} />;
};

export default StandalonePracticeInstructionsPage;
