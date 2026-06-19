import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { Card, PageShell } from '../components/ui/layout';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer } from '../lib/use-live-game-timer';
import { formatMs } from '../lib/time-format';

export function GameDetailPage() {
  const { id = '' } = useParams();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    fetchGame(id)
      .then(setGame)
      .catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useGameStream(id, reload, Boolean(game));

  const timer = useLiveGameTimer(game);
  const backTo = game?.eventShortCode ? `/events/${game.eventShortCode}` : '/';

  return (
    <PageShell title="比赛详情" backTo={backTo}>
      {error && <p className="text-sm text-danger">{error}</p>}
      {game && timer && (
        <>
          <Card className="text-center">
            <div className="font-score tabular-nums text-score">
              {game.scoreA} : {game.scoreB}
            </div>
            <p className="mt-2 text-sm text-textSec">
              {game.teamA?.name} vs {game.teamB?.name} · {timer.status}
            </p>
            <p className="text-xs text-textSec">
              {timer.status === 'FINISHED'
                ? `已结束 · 用时 ${formatMs(timer.elapsedMs)}`
                : `已用 ${formatMs(timer.elapsedMs)} / ${formatMs(timer.plannedDurationMs)}`}
            </p>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">事件流</h2>
            <GameEventFeed game={game} scorableOnly />
          </Card>
          {game.eventShortCode && (
            <p className="text-center text-xs text-textSec">
              活动分享码{' '}
              <Link to={`/events/${game.eventShortCode}`} className="font-mono text-primary">
                {game.eventShortCode}
              </Link>
            </p>
          )}
        </>
      )}
      {!game && !error && <p className="text-sm text-textSec">加载中…</p>}
    </PageShell>
  );
}
