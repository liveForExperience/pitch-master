import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchGame } from '../api/events';
import { fetchGameReport } from '../api/reports';
import type { GameReport } from '../api/types';
import { GameReportView } from '../components/report/GameReportView';
import { PageShell } from '../components/ui/layout';
import { useT } from '../i18n';

export function GameReportPage() {
  const t = useT();
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
    <PageShell title={t('reports.gameTitle')} backTo={backTo} forceLight>
      {error && <p className="text-sm text-danger">{error}</p>}
      {report && <GameReportView report={report} eventShortCode={eventShortCode} />}
      {!report && !error && <p className="text-sm text-textSec">{t('common.loading')}</p>}
    </PageShell>
  );
}
