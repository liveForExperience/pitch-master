import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MatchList from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import MatchFinance from './pages/MatchFinance';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-900 text-white pb-16">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/matches" element={<MatchList />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/matches/:id/finance" element={<MatchFinance />} />
          <Route path="/" element={<Navigate to="/matches" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
