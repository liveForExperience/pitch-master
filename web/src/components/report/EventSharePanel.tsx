import { buildEventShareText, eventReportPath } from '../../lib/share-report';
import { eventPosterUrl } from '../../lib/poster-url';
import { PagePanel, PagePanelBody, PagePanelHeader } from '../ui/page-panel';
import { ReportShareGrid } from './ReportShareGrid';
import { useT } from '../../i18n';

export function EventSharePanel({
  eventName,
  shortCode,
}: {
  eventName: string;
  shortCode: string;
}) {
  const t = useT();
  const code = shortCode.trim().toUpperCase();
  const reportPath = eventReportPath(code);

  return (
    <PagePanel>
      <PagePanelHeader title={t('share.sectionTitle')} />
      <PagePanelBody>
        <ReportShareGrid
          share={{
            title: `${eventName} · ${t('reports.eventTitle')}`,
            text: buildEventShareText(eventName, code, t),
            url: reportPath,
            posterUrl: eventPosterUrl(code),
          }}
          reportPath={reportPath}
        />
      </PagePanelBody>
    </PagePanel>
  );
}
