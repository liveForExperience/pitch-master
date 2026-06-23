import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { renamePerson } from '../../api/persons';
import { useT } from '../../i18n';

type Props = {
  personId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenamed: () => void;
};

export function PersonRenameDialog({
  personId,
  currentName,
  open,
  onOpenChange,
  onRenamed,
}: Props) {
  const t = useT();
  const [draft, setDraft] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setDraft(currentName);
    setError('');
  };

  const submit = async () => {
    const next = draft.trim();
    if (!next || next === currentName) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await renamePerson(personId, next);
      onOpenChange(false);
      onRenamed();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('personRename.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-5 shadow-lg">
          <Dialog.Title className="text-base font-semibold text-textPri">
            {t('personRename.title')}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-textSec">
            {t('personRename.desc')}
          </Dialog.Description>
          <input
            className="mt-4 w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-textPri outline-none focus:border-primary"
            value={draft}
            disabled={saving}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
          />
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-textSec"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-textInv disabled:opacity-50"
              disabled={saving || !draft.trim()}
              onClick={() => void submit()}
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
