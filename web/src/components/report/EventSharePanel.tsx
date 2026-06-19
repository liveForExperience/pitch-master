import { Link } from 'react-router-dom';
import { buildEventShareText, eventReportPath } from '../../lib/share-report';
import { eventPosterUrl } from '../../lib/poster-url';
import { ShareReportButton } from './ShareReportButton';

export function EventSharePanel({
  eventName,
  shortCode,
}: {
  eventName: string;
  shortCode: string;
}) {
  const code = shortCode.trim().toUpperCase();
  const reportPath = eventReportPath(code);

  return (
    <section className="space-y-3 border-t border-border pt-6">
      <p className="text-body font-bold text-textPri">分享战报</p>
      <ShareReportButton
        share={{
          title: `${eventName} · 活动战报`,
          text: buildEventShareText(eventName, code),
          url: reportPath,
          posterUrl: eventPosterUrl(code),
        }}
        label="分享战报"
      />
      <Link
        to={reportPath}
        className="block text-center text-caption text-primary"
      >
        打开战报 H5 预览
      </Link>
    </section>
  );
}
