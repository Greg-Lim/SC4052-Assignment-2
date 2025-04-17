import { Routes, Route } from 'react-router-dom';
import './App.css';
import PracticeInstructionsPage from './Components/PracticeInstructionsPage';
import SearchPage from './Components/SearchPage';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/practice/:owner/:repo/:issueId" element={<PracticeInstructionsPage />} />
      </Routes>
    </div>
  );
}

export default App;
