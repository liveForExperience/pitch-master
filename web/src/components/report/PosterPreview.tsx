import { useState } from 'react';
import { shareReport, type ShareReportInput } from '../../lib/share-report';
import { useT } from '../../i18n';

/**
 * Editorial poster preview: tap the image to share, secondary action to save.
 * Removed the v1 card shell + h2 title — caller decides framing.
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
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const trigger = async () => {
    if (!share) return;
    setBusy(true);
    setCopied(false);
    try {
      const result = await shareReport({ ...share, posterUrl: share.posterUrl ?? src });
      if (result === 'copied') {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
    } finally {
      setBusy(false);
    }
  };

  return (
    <figure className="space-y-3">
      <button
        type="button"
        onClick={() => void trigger()}
        disabled={!share || busy}
        className="block w-full overflow-hidden rounded-xl border border-border bg-surface active:bg-elevated disabled:opacity-80"
        aria-label={title ? t('poster.shareAlt', { title }) : t('poster.tapToShare')}
      >
        <img src={src} alt={title ?? t('poster.imageAlt')} className="block w-full" loading="lazy" />
      </button>
      <div className="flex items-center justify-between text-caption text-textSec">
        <span>
          {share
            ? copied
              ? t('share.copied')
              : busy
                ? t('share.preparing')
                : t('poster.tapToShare')
            : t('poster.fallback')}
        </span>
        <a href={src} download={downloadName} className="font-mono uppercase tracking-[0.14em] text-primary">
          {t('poster.download')}
        </a>
      </div>
    </figure>
  );
}
