import React from "react";

// Placeholder for future PR review features
const PRReviewPanel = ({ issue }) => {
  return (
    <div style={{ height: '100%', boxSizing: 'border-box', border: '1px solid #e1e4e8', borderRadius: 6, background: '#fafbfc', padding: '2rem' }}>
      <h2>PR Review Panel</h2>
      <p>This panel will be used in the future to review the user PR.</p>
      {/* You can access the issue and PR details via the `issue` prop */}
    </div>
  );
};

export default PRReviewPanel;
