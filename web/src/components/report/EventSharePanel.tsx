import { Link } from 'react-router-dom';
import { buildEventShareText, eventReportPath } from '../../lib/share-report';
import { eventPosterUrl } from '../../lib/poster-url';
import { ShareReportButton } from './ShareReportButton';
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
    <section className="space-y-3 border-t border-border pt-6">
      <p className="text-body font-bold text-textPri">{t('share.label')}</p>
      <ShareReportButton
        share={{
          title: `${eventName} · ${t('reports.eventTitle')}`,
          text: buildEventShareText(eventName, code, t),
          url: reportPath,
          posterUrl: eventPosterUrl(code),
        }}
        label={t('share.label')}
      />
      <Link to={reportPath} className="block text-center text-caption text-primary">
        {t('share.openH5')}
      </Link>
    </section>
  );
}
