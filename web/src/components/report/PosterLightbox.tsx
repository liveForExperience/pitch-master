import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { useT } from '../../i18n';
import {
  canShareFile,
  copyImageToClipboard,
  fetchPosterBlob,
  reportPageUrl,
  triggerDownload,
  type ShareReportInput,
} from '../../lib/share-report';
import { cn } from '../../lib/cn';

type Status = 'idle' | 'busy' | 'copied' | 'error';

/**
 * Full-screen poster lightbox.
 *
 * Three operations are exposed, each fitting a different real-world flow:
 *   - 复制图片 → for users who want to paste into WeChat (clipboard image)
 *   - 保存图片 → download fallback (saves to Files / Downloads)
 *   - 分享…    → only when navigator.share supports files (iOS / Android Chrome)
 *
 * Inside the WeChat in-app webview none of these may work; the long-press hint
 * is therefore always visible because long-press → save / forward is the only
 * universally reliable path on that surface.
 */
export function PosterLightbox({
  open,
  onOpenChange,
  src,
  downloadName,
  share,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  downloadName: string;
  share?: ShareReportInput;
  title?: string;
}) {
  const t = useT();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supportsShare, setSupportsShare] = useState(false);
  const [supportsClipboardImage, setSupportsClipboardImage] = useState(false);
  const blobCacheRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setSupportsClipboardImage(
      typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write,
    );
    if (typeof File === 'function') {
      try {
        const probe = new File([new Blob()], 'probe.png', { type: 'image/png' });
        setSupportsShare(canShareFile(probe));
      } catch {
        setSupportsShare(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      setErrorMsg(null);
      blobCacheRef.current = null;
    }
  }, [open]);

  async function getBlob(): Promise<Blob> {
    if (blobCacheRef.current) return blobCacheRef.current;
    const blob = await fetchPosterBlob(src, t);
    blobCacheRef.current = blob;
    return blob;
  }

  async function handleCopy() {
    setStatus('busy');
    setErrorMsg(null);
    try {
      const blob = await getBlob();
      await copyImageToClipboard(blob, t);
      setStatus('copied');
      window.setTimeout(() => setStatus((s) => (s === 'copied' ? 'idle' : s)), 2500);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('common.error.clipboardImage'));
    }
  }

  function handleSave() {
    triggerDownload(src, downloadName);
  }

  async function handleShare() {
    if (!share) return;
    setStatus('busy');
    setErrorMsg(null);
    try {
      const blob = await getBlob();
      const file = new File([blob], downloadName, { type: blob.type || 'image/png' });
      const url = reportPageUrl(share.url);
      const message = `${share.text}\n${url}`;
      if (canShareFile(file)) {
        await navigator.share({ title: share.title, text: message, files: [file] });
      } else {
        await navigator.share({ title: share.title, text: message, url });
      }
      setStatus('idle');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : t('common.error.share'));
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {title ?? t('poster.imageAlt')}
          </DialogPrimitive.Title>

          <DialogPrimitive.Close
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition hover:bg-white/20"
            aria-label={t('poster.lightbox.close')}
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
          >
            <X size={20} weight="bold" />
          </DialogPrimitive.Close>

          {/* Image area: pinch-zoom enabled on iOS via touch-action; long-press reveals
              the system "save / share image" sheet on iOS & Android natively. */}
          <div className="flex flex-1 items-center justify-center overflow-auto px-4 py-4">
            <img
              src={src}
              alt={title ?? t('poster.imageAlt')}
              className="block h-auto max-h-full w-auto max-w-full select-none"
              draggable={false}
              style={{
                touchAction: 'pinch-zoom',
                WebkitTouchCallout: 'default',
              }}
            />
          </div>

          {/* Action bar */}
          <div
            className="border-t border-white/10 bg-black/60 px-4 pt-3 backdrop-blur"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
            }}
          >
            <p className="mb-3 text-center text-xs text-white/70">
              {status === 'copied'
                ? t('poster.lightbox.copied')
                : errorMsg ?? t('poster.lightbox.longPressHint')}
            </p>

            <div
              className={cn(
                'grid gap-2',
                supportsShare ? 'grid-cols-3' : 'grid-cols-2',
              )}
            >
              <ActionButton
                disabled={status === 'busy' || !supportsClipboardImage}
                onClick={() => void handleCopy()}
                primary
              >
                {status === 'busy'
                  ? t('poster.lightbox.copying')
                  : t('poster.lightbox.copy')}
              </ActionButton>

              <ActionButton onClick={handleSave}>
                {t('poster.lightbox.save')}
              </ActionButton>

              {supportsShare && share && (
                <ActionButton
                  disabled={status === 'busy'}
                  onClick={() => void handleShare()}
                >
                  {status === 'busy'
                    ? t('poster.lightbox.sharing')
                    : t('poster.lightbox.share')}
                </ActionButton>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl px-4 py-3 text-center text-sm font-semibold transition',
        'disabled:opacity-50',
        primary
          ? 'bg-white text-black active:bg-white/90'
          : 'border border-white/30 text-white active:bg-white/10',
      )}
    >
      {children}
    </button>
  );
}
