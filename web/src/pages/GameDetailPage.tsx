import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { Card, PageShell } from '../components/ui/layout';
import { ShareReportButton } from '../components/report/ShareReportButton';
import { useT } from '../i18n';
import { gamePosterUrl } from '../lib/poster-url';
import { buildGameShareText, gameReportPath } from '../lib/share-report';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer } from '../lib/use-live-game-timer';
import { formatMs } from '../lib/time-format';

export function GameDetailPage() {
  const t = useT();
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
    <PageShell title={t('detail.title')} backTo={backTo}>
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
                ? t('detail.finished', { elapsed: formatMs(timer.elapsedMs) })
                : t('detail.elapsed', {
                    elapsed: formatMs(timer.elapsedMs),
                    planned: formatMs(timer.plannedDurationMs),
                  })}
            </p>
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">{t('detail.eventStream')}</h2>
            <GameEventFeed game={game} scorableOnly />
          </Card>
          <Card className="space-y-3">
            <h2 className="font-semibold text-textPri">{t('detail.share.title')}</h2>
            <ShareReportButton
              share={{
                title: t('detail.share.subject', {
                  teamA: game.teamA?.name ?? 'A',
                  teamB: game.teamB?.name ?? 'B',
                }),
                text: buildGameShareText(
                  game.teamA?.name ?? 'A',
                  game.teamB?.name ?? 'B',
                  game.scoreA,
                  game.scoreB,
                ),
                url: gameReportPath(id),
                posterUrl: gamePosterUrl(id),
              }}
            />
            <Link
              to={`/games/${id}/report`}
              className="block text-center text-sm text-primary"
            >
              {t('detail.share.preview')}
            </Link>
          </Card>
          {game.eventShortCode && (
            <p className="text-center text-xs text-textSec">
              {t('detail.share.shortCode')}{' '}
              <Link to={`/events/${game.eventShortCode}`} className="font-mono text-primary">
                {game.eventShortCode}
              </Link>
            </p>
          )}
        </>
      )}
      {!game && !error && <p className="text-sm text-textSec">{t('common.loading')}</p>}
    </PageShell>
  );
}
