import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog';
import { useT } from '../../i18n';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  processingLabel: string;
  processing: boolean;
  onConfirm: () => void;
};

export function ConfirmDangerDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  processingLabel,
  processing,
  onConfirm,
}: Props) {
  const t = useT();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 flex-1 rounded-lg border border-border px-3 text-sm font-semibold text-textSec"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={() => void onConfirm()}
            className="min-h-11 flex-1 rounded-lg bg-danger px-3 text-sm font-semibold text-textInv disabled:opacity-50"
          >
            {processing ? processingLabel : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
