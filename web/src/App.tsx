import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { NewEventPage } from './pages/NewEventPage';
import { EventPage } from './pages/EventPage';
import { EventSetupPage } from './pages/EventSetupPage';
import { NewGamePage } from './pages/NewGamePage';
import { GameRecordPage } from './pages/GameRecordPage';
import { GameDetailPage } from './pages/GameDetailPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events/new" element={<NewEventPage />} />
        <Route path="/events/:shortCode" element={<EventPage />} />
        <Route path="/events/:shortCode/setup" element={<EventSetupPage />} />
        <Route path="/games/new" element={<NewGamePage />} />
        <Route path="/games/:id/record" element={<GameRecordPage />} />
        <Route path="/games/:id" element={<GameDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
