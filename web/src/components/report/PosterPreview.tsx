import { ShareReportButton } from './ShareReportButton';
import { Card } from '../ui/card';
import type { ShareReportInput } from '../../lib/share-report';

export function PosterPreview({
  title,
  src,
  downloadName,
  share,
}: {
  title: string;
  src: string;
  downloadName: string;
  share?: ShareReportInput;
}) {
  return (
    <Card className="space-y-3">
      <h2 className="text-h2 font-bold text-textPri">{title}</h2>
      <img
        src={src}
        alt={title}
        className="w-full rounded-xl border border-border bg-surface"
        loading="lazy"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {share && (
          <ShareReportButton share={{ ...share, posterUrl: share.posterUrl ?? src }} variant="primary" />
        )}
        <a
          href={src}
          download={downloadName}
          className={`block min-h-12 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm font-semibold text-primary ${share ? '' : 'sm:col-span-2'}`}
        >
          下载海报 PNG
        </a>
      </div>
    </Card>
  );
}
