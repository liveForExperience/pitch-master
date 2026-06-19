import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import { fetchGameReport } from '../api/reports';
import type { GameReport } from '../api/types';
import { GameReportView } from '../components/report/GameReportView';
import { PosterPreview } from '../components/report/PosterPreview';
import { Card, PageShell } from '../components/ui/layout';
import { gamePosterUrl } from '../lib/poster-url';
import { buildGameShareText, gameReportPath } from '../lib/share-report';

export function GameReportPage() {
  const { id = '' } = useParams();
  const [report, setReport] = useState<GameReport | null>(null);
  const [eventShortCode, setEventShortCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    setError('');
    Promise.all([fetchGameReport(id), fetchGame(id)])
      .then(([reportData, gameDetail]) => {
        setReport(reportData);
        setEventShortCode(gameDetail.eventShortCode);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const backTo = eventShortCode
    ? `/events/${eventShortCode}/report`
    : report
      ? `/games/${id}`
      : '/';

  const teamA = report?.game.teamA?.name ?? 'A 队';
  const teamB = report?.game.teamB?.name ?? 'B 队';
  const scoreA = report?.game.scoreA ?? 0;
  const scoreB = report?.game.scoreB ?? 0;

  return (
    <PageShell title="单场战报" backTo={backTo}>
      {report && eventShortCode && (
        <Card className="border-primary/30 bg-primary/5 text-center">
          <Link to={`/events/${eventShortCode}`} className="text-sm font-semibold text-primary">
            想下次也来踢吗？→ 进活动主页
          </Link>
        </Card>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {report && (
        <>
          <PosterPreview
            title="单场战报海报"
            src={gamePosterUrl(id)}
            downloadName={`pitchmaster-game-${id}-report.png`}
            share={{
              title: `${teamA} vs ${teamB} · 单场战报`,
              text: buildGameShareText(teamA, teamB, scoreA, scoreB),
              url: gameReportPath(id),
              posterUrl: gamePosterUrl(id),
            }}
          />
          <GameReportView report={report} eventShortCode={eventShortCode} />
        </>
      )}
      {!report && !error && <p className="text-sm text-textSec">加载中…</p>}
    </PageShell>
  );
}
