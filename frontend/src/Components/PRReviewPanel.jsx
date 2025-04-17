import React from "react";
import OpenAIKeyAuth from "./OpenAIKeyAuth";
import "./PRReviewPanel.css";

const PRReviewPanel = ({ issue }) => {
  return (
    <div className="pr-review-panel-container">
      <h2>PR Review Panel</h2>
      <OpenAIKeyAuth />
      <p>This panel will be used in the future to review the user PR.</p>
    </div>
  );
};

export default PRReviewPanel;
