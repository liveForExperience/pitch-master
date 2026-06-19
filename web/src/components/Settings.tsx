import { useState } from 'react';
import { Gear } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';
import { setLocale, useLocale, useT, type Locale } from '../i18n';
import { setTheme, useTheme, type Theme } from '../lib/theme';
import { cn } from '../lib/cn';

function SegmentedRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<{ id: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl border border-border bg-chipBg p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors',
              active
                ? 'bg-surface text-textPri shadow-sm'
                : 'text-textSec hover:text-textPri',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const t = useT();
  const locale = useLocale();
  const theme = useTheme();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('settings.openLabel')}
        className={cn(
          'inline-flex h-10 w-10 items-center justify-center rounded-full text-textSec active:bg-elevated',
          className,
        )}
      >
        <Gear size={20} weight="duotone" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription>{t('settings.subtitle')}</DialogDescription>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-sm font-semibold text-textPri">
                {t('settings.language')}
              </p>
              <SegmentedRow<Locale>
                value={locale}
                onChange={setLocale}
                options={[
                  { id: 'zh', label: t('settings.language.zh') },
                  { id: 'en', label: t('settings.language.en') },
                ]}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-textPri">
                {t('settings.theme')}
              </p>
              <SegmentedRow<Theme>
                value={theme}
                onChange={setTheme}
                options={[
                  { id: 'light', label: t('settings.theme.light') },
                  { id: 'dark', label: t('settings.theme.dark') },
                ]}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-6 min-h-11 w-full rounded-xl border border-border text-sm font-semibold text-textSec active:bg-elevated"
          >
            {t('common.close')}
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
