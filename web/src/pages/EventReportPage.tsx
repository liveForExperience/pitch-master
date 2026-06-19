import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchEventReport } from '../api/reports';
import type { EventReport } from '../api/types';
import { EventReportView } from '../components/report/EventReportView';
import { PageShell } from '../components/ui/layout';

export function EventReportPage() {
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
    <PageShell title="活动战报" backTo={`/events/${code}`}>
      {error && <p className="text-sm text-danger">{error}</p>}
      {report && <EventReportView report={report} />}
      {!report && !error && <p className="text-sm text-textSec">加载中…</p>}
    </PageShell>
  );
}
