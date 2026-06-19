import { useT } from '../i18n';
import { formatDeviceTail } from '../lib/device-id';
import type { EditorState } from '../api/types';

export function EditorLeaseBanner({
  editor,
  myDeviceId,
  busy,
  canControlTimer,
  onClaim,
  onForce,
  onRelease,
}: {
  editor: EditorState;
  myDeviceId: string;
  busy: boolean;
  canControlTimer: boolean;
  onClaim: () => void;
  onForce: () => void;
  onRelease: () => void;
}) {
  const t = useT();
  const holderTail = formatDeviceTail(editor.deviceId);
  const myTail = formatDeviceTail(myDeviceId);

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm">
      {canControlTimer ? (
        <p className="text-textPri">{t('record.editor.holding', { tail: myTail })}</p>
      ) : editor.deviceId ? (
        <p className="text-textSec">{t('record.editor.other', { tail: holderTail })}</p>
      ) : (
        <p className="text-textSec">{t('record.editor.readonly')}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {canControlTimer ? (
          <button
            type="button"
            className="text-xs font-semibold text-primary"
            onClick={onRelease}
          >
            {t('record.editor.release')}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              className="text-xs font-semibold text-primary disabled:opacity-50"
              onClick={onClaim}
            >
              {t('record.editor.claim')}
            </button>
            {editor.deviceId && (
              <button
                type="button"
                disabled={busy}
                className="text-xs font-semibold text-warning disabled:opacity-50"
                onClick={onForce}
              >
                {t('record.editor.force')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
