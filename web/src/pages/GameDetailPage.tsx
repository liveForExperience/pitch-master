import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import type { GameDetail } from '../api/types';
import { GameEventFeed } from '../components/GameEventFeed';
import { GameScoreHeader } from '../components/game/GameScoreHeader';
import { InlineAlert } from '../components/ui/inline-alert';
import { PageShell } from '../components/ui/layout';
import { PagePanel, PagePanelBody, PagePanelHeader } from '../components/ui/page-panel';
import { ReportShareGrid } from '../components/report/ReportShareGrid';
import { useT } from '../i18n';
import { gamePosterUrl } from '../lib/poster-url';
import { buildGameShareText, gameReportPath } from '../lib/share-report';
import { useGameStream } from '../lib/use-game-stream';
import { useLiveGameTimer } from '../lib/use-live-game-timer';

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
      {error && <InlineAlert>{error}</InlineAlert>}
      {game && timer && (
        <>
          <PagePanel className="overflow-hidden">
            <GameScoreHeader game={game} timer={timer} />
          </PagePanel>

          <PagePanel>
            <PagePanelHeader title={t('detail.eventStream')} />
            <PagePanelBody>
              <GameEventFeed game={game} scorableOnly />
            </PagePanelBody>
          </PagePanel>

          <PagePanel>
            <PagePanelHeader title={t('detail.share.title')} />
            <PagePanelBody className="p-3">
              <ReportShareGrid
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
                reportPath={`/games/${id}/report`}
              />
            </PagePanelBody>
          </PagePanel>

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
