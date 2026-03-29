import { useLayoutEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TournamentList from './pages/TournamentList';
import MatchList from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import MatchFinance from './pages/MatchFinance';
import MatchGrouping from './pages/MatchGrouping';
import MatchLive from './pages/MatchLive';
import GameDetail from './pages/GameDetail';
import MatchPublish from './pages/MatchPublish';
import MatchTrash from './pages/MatchTrash';
import PlayerRatingDemo from './pages/PlayerRatingDemo';
import GlobalNav from './components/GlobalNav';
import useThemeStore from './store/useThemeStore';

// 主题应用器：监听主题状态，写入 <html> 的 class
const ThemeApplier = () => {
  const { theme } = useThemeStore();

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return null;
};

// 导航包装组件：处理全局导航的显示逻辑
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const hideNavPaths = ['/login', '/register', '/tournaments'];
  const shouldShowNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 text-gray-900 dark:text-white selection:bg-primary selection:text-black transition-colors duration-200">
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
      <ThemeApplier />
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Tournament 大厅（登录后首页） */}
          <Route path="/tournaments" element={<TournamentList />} />

          {/* Tournament 维度下的赛事路由 */}
          <Route path="/tournaments/:tournamentId/matches" element={<MatchList />} />
          <Route path="/tournaments/:tournamentId/matches/publish" element={<MatchPublish />} />
          <Route path="/tournaments/:tournamentId/matches/trash" element={<MatchTrash />} />
          <Route path="/tournaments/:tournamentId/matches/:id" element={<MatchDetail />} />
          <Route path="/tournaments/:tournamentId/matches/:id/edit" element={<MatchPublish />} />
          <Route path="/tournaments/:tournamentId/matches/:id/finance" element={<MatchFinance />} />
          <Route path="/tournaments/:tournamentId/matches/:id/grouping" element={<MatchGrouping />} />
          <Route path="/tournaments/:tournamentId/matches/:id/live" element={<MatchLive />} />
          <Route path="/tournaments/:tournamentId/matches/:id/games/:gameId" element={<GameDetail />} />

          {/* 兼容旧路由：重定向到 tournaments */}
          <Route path="/matches" element={<Navigate to="/tournaments" replace />} />
          <Route path="/matches/*" element={<Navigate to="/tournaments" replace />} />

          <Route path="/player/rating-demo" element={<PlayerRatingDemo />} />
          <Route path="/" element={<Navigate to="/tournaments" replace />} />
          <Route path="*" element={<Navigate to="/tournaments" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
