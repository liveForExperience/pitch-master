import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEventReport } from '../api/reports';
import type { EventReport } from '../api/types';
import { EventReportView } from '../components/report/EventReportView';
import { PageShell } from '../components/ui/layout';
import { useT } from '../i18n';

export function EventReportPage() {
  const t = useT();
  const { shortCode = '' } = useParams();
  const [report, setReport] = useState<EventReport | null>(null);
  const [error, setError] = useState('');
  const code = shortCode.trim().toUpperCase();

  const load = useCallback(() => {
    if (!code) return;
    setError('');
    fetchEventReport(code)
      .then(setReport)
      .catch((err: Error) => setError(err.message));
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageShell title={t('reports.eventTitle')} backTo={`/events/${code}`} forceLight>
      {error && <p className="text-sm text-danger">{error}</p>}
      {report && <EventReportView report={report} />}
      {!report && !error && <p className="text-sm text-textSec">{t('common.loading')}</p>}
    </PageShell>
  );
}
