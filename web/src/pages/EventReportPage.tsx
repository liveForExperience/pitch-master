import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchEventReport } from '../api/reports';
import type { EventReport } from '../api/types';
import { EventReportView } from '../components/report/EventReportView';
import { PosterPreview } from '../components/report/PosterPreview';
import { PageShell } from '../components/ui/layout';
import { eventPosterUrl } from '../lib/poster-url';
import { buildEventShareText, eventReportPath } from '../lib/share-report';
import { Card } from '../components/ui/card';

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
      {report && (
        <Card className="border-primary/30 bg-primary/5 text-center">
          <Link to={`/events/${report.event.shortCode}`} className="text-sm font-semibold text-primary">
            想下次也来踢吗？→ 进活动主页
          </Link>
        </Card>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
      {report && (
        <>
          <PosterPreview
            title="活动战报海报"
            src={eventPosterUrl(report.event.shortCode)}
            downloadName={`pitchmaster-${report.event.shortCode}-report.png`}
            share={{
              title: `${report.event.name} · 活动战报`,
              text: buildEventShareText(report.event.name, report.event.shortCode),
              url: eventReportPath(report.event.shortCode),
              posterUrl: eventPosterUrl(report.event.shortCode),
            }}
          />
          <EventReportView report={report} />
        </>
      )}
      {!report && !error && <p className="text-sm text-textSec">加载中…</p>}
    </PageShell>
  );
}
