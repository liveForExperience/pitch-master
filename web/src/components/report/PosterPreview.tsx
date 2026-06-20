import { useState } from 'react';
import { type ShareReportInput } from '../../lib/share-report';
import { useT } from '../../i18n';
import { PosterLightbox } from './PosterLightbox';

/**
 * Editorial poster thumbnail. Tap to open the full-screen lightbox; the
 * lightbox owns all share/copy/save flows. We deliberately removed the
 * inline DOWNLOAD link — on mobile a floating link looked clickable but
 * iOS Safari would not actually save it without long-press anyway.
 */
export function PosterPreview({
  src,
  downloadName,
  share,
  title,
}: {
  src: string;
  downloadName: string;
  share?: ShareReportInput;
  /** Optional accessible label; not rendered visually */
  title?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <figure className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-xl border border-border bg-surface active:bg-elevated"
        aria-label={title ? t('poster.openAlt', { title }) : t('poster.tapToOpen')}
      >
        <img src={src} alt={title ?? t('poster.imageAlt')} className="block w-full" loading="lazy" />
      </button>
      <p className="text-center text-caption text-textSec">{t('poster.tapToOpen')}</p>

      <PosterLightbox
        open={open}
        onOpenChange={setOpen}
        src={src}
        downloadName={downloadName}
        share={share}
        title={title}
      />
    </figure>
  );
}
