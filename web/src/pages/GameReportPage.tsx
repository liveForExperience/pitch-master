import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import { fetchGameReport } from '../api/reports';
import type { GameReport } from '../api/types';
import { GameReportView } from '../components/report/GameReportView';
import { PageShell } from '../components/ui/layout';

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

  return (
    <PageShell title="单场战报" backTo={backTo}>
      {error && <p className="text-sm text-danger">{error}</p>}
      {report && <GameReportView report={report} eventShortCode={eventShortCode} />}
      {!report && !error && <p className="text-sm text-textSec">加载中…</p>}
    </PageShell>
  );
}
