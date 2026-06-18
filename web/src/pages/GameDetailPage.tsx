import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import type { GameDetail } from '../api/types';
import { Card, PageShell } from '../components/ui/layout';
import { formatMs } from '../lib/time-format';

export function GameDetailPage() {
  const { id = '' } = useParams();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGame(id)
      .then(setGame)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  return (
    <PageShell title="比赛详情" backTo="/">
      {error && <p className="text-sm text-danger">{error}</p>}
      {game && (
        <>
          <Card className="text-center">
            <div className="font-score tabular-nums text-score">
              {game.scoreA} : {game.scoreB}
            </div>
            <p className="mt-2 text-sm text-textSec">
              {game.teamA?.name} vs {game.teamB?.name} · {game.game.status}
            </p>
            <p className="text-xs text-textSec">
              已用 {formatMs(game.timer.elapsedMs)} / {formatMs(game.timer.plannedDurationMs)}
            </p>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">事件流</h2>
            <ul className="space-y-1 text-sm">
              {game.events.map((e) => (
                <li key={e.id} className="flex justify-between border-b border-border py-1">
                  <span>{e.type}</span>
                  <span className="text-textSec">{new Date(e.serverTs).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </PageShell>
  );
}
