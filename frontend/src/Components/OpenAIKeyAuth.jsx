import React, { useState, useEffect } from "react";

const OpenAIKeyAuth = () => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [isOpenaiAuthenticated, setIsOpenaiAuthenticated] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setOpenaiKey(savedKey);
      setIsOpenaiAuthenticated(true);
    }
  }, []);

  const handleOpenaiKeySubmit = (e) => {
    e.preventDefault();
    if (openaiKey.trim()) {
      localStorage.setItem("openai_api_key", openaiKey);
      setIsOpenaiAuthenticated(true);
    }
  };

  const handleOpenaiKeyChange = (e) => {
    setOpenaiKey(e.target.value);
  };

  const handleOpenaiLogout = () => {
    localStorage.removeItem("openai_api_key");
    setOpenaiKey("");
    setIsOpenaiAuthenticated(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '2rem' }}>
      {!isOpenaiAuthenticated ? (
        <div className="auth-container" style={{ maxWidth: 500, margin: '1rem auto' }}>
          <p>Some features require your OpenAI API key. Please enter it below:</p>
          <form onSubmit={handleOpenaiKeySubmit} className="token-form">
            <input
              type="password"
              value={openaiKey}
              onChange={handleOpenaiKeyChange}
              placeholder="OpenAI API Key"
              className="token-input"
              required
            />
            <button type="submit" className="token-submit">Authenticate</button>
          </form>
          <div className="token-help">
            <p>You can create an API key in your
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"> OpenAI account</a>.
            </p>
          </div>
        </div>
      ) : (
        <div className="auth-status" style={{ marginBottom: '1rem' }}>
          <span>✓ OpenAI Key Set</span>
          <button onClick={handleOpenaiLogout} className="logout-button">Remove Key</button>
        </div>
      )}
    </div>
  );
};

export default OpenAIKeyAuth;
