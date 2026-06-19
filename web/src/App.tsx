import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { NewEventPage } from './pages/NewEventPage';
import { EventPage } from './pages/EventPage';
import { EventSetupPage } from './pages/EventSetupPage';
import { NewGamePage } from './pages/NewGamePage';
import { GameRecordPage } from './pages/GameRecordPage';
import { AdminRestorePage } from './pages/AdminRestorePage';
import { GameDetailPage } from './pages/GameDetailPage';
import { GameReportPage } from './pages/GameReportPage';
import { EventReportPage } from './pages/EventReportPage';
import { OutboxSync } from './components/OutboxSync';
import { OfflineStatusBar } from './components/OfflineStatusBar';

export function App() {
  return (
    <BrowserRouter>
      <OutboxSync />
      <OfflineStatusBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/restore" element={<AdminRestorePage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:shortCode/report" element={<EventReportPage />} />
        <Route path="/events/:shortCode/setup" element={<EventSetupPage />} />
        <Route path="/events/:shortCode" element={<EventPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:id/report" element={<GameReportPage />} />
        <Route path="/games/:id/record" element={<GameRecordPage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
