import { Link } from 'react-router-dom';
import { buildEventShareText, eventReportPath } from '../../lib/share-report';
import { eventPosterUrl } from '../../lib/poster-url';
import { Card } from '../ui/card';
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
    <Card className="space-y-3">
      <h2 className="text-h2 font-bold text-textPri">分享活动战报</h2>
      <ShareReportButton
        share={{
          title: `${eventName} · 活动战报`,
          text: buildEventShareText(eventName, code),
          url: reportPath,
          posterUrl: eventPosterUrl(code),
        }}
      />
      <Link to={reportPath} className="block text-center text-sm text-primary">
        打开战报 H5 预览
      </Link>
    </Card>
  );
}
