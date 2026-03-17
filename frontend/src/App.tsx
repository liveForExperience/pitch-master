import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MatchList from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import MatchFinance from './pages/MatchFinance';
import MatchGrouping from './pages/MatchGrouping';
import MatchPublish from './pages/MatchPublish';
import PlayerRatingDemo from './pages/PlayerRatingDemo';
import GlobalNav from './components/GlobalNav';

// 导航包装组件：处理全局导航的显示逻辑
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register'];
  const shouldShowNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-primary selection:text-black">
      {/* DEBUG ELEMENT */}
      <div className="fixed top-0 left-0 w-full h-1 bg-primary z-[9999]"></div>
      
      {shouldShowNav && <GlobalNav />}
      {children}
    </div>
  );
};

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/matches" element={<MatchList />} />
          <Route path="/matches/publish" element={<MatchPublish />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/matches/:id/edit" element={<MatchPublish />} />
          <Route path="/matches/:id/finance" element={<MatchFinance />} />
          <Route path="/matches/:id/grouping" element={<MatchGrouping />} />
          <Route path="/player/rating-demo" element={<PlayerRatingDemo />} />
          <Route path="/" element={<Navigate to="/matches" replace />} />
          <Route path="*" element={<Navigate to="/matches" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
