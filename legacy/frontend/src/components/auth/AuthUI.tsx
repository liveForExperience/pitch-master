import React, { forwardRef } from 'react';
import { ChevronLeft, Minus, Plus, type LucideIcon } from 'lucide-react';

export interface AuthInfoCardItem {
  label: string;
  description: string;
}

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

interface AuthHeaderProps {
  badge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ badge, title, description, className }) => (
  <header className={cn('text-left', className)}>
    <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-6">
      {badge}
    </div>
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter mb-4">{title}</h1>
    <p className="max-w-2xl text-gray-500 dark:text-neutral-500 font-medium text-base sm:text-lg">{description}</p>
  </header>
);

const AuthInfoCards: React.FC<{
  items: AuthInfoCardItem[];
  gridClassName?: string;
}> = ({ items, gridClassName }) => (
  <div className={cn('mt-6 grid gap-3', gridClassName ?? 'grid-cols-3')}>
    {items.map((item) => (
      <div
        key={item.label}
        className="rounded-[1.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/70 px-4 py-4 text-center"
      >
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">{item.label}</div>
        <div className="text-xs font-bold text-gray-500 dark:text-neutral-400">{item.description}</div>
      </div>
    ))}
  </div>
);

export const AuthCard: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn(
      'rounded-[2.5rem] border border-gray-200 dark:border-neutral-900 bg-white dark:bg-neutral-950/90 p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
      className,
    )}
  >
    {children}
  </div>
);

export const AuthDesktopShowcase: React.FC<{
  badge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  cards: AuthInfoCardItem[];
}> = ({ badge, title, description, cards }) => (
  <div className="hidden lg:flex lg:w-1/2 relative items-stretch p-8 xl:p-10">
    <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-[2.75rem] border border-neutral-900 bg-neutral-950 p-10 xl:p-12">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] h-[50%] w-[70%] rounded-full bg-primary/10 blur-[140px]"></div>
        <div className="absolute bottom-[-15%] left-[-10%] h-72 w-72 rounded-full bg-white/5 blur-[120px]"></div>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>
      </div>

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">
          {badge}
        </div>
        <h1 className="text-6xl xl:text-7xl font-black text-white leading-[0.95] tracking-tighter mb-8">{title}</h1>
        <p className="max-w-lg text-lg xl:text-xl leading-relaxed text-neutral-500 font-medium">{description}</p>
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-4">
        {cards.map((item) => (
          <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">{item.label}</div>
            <div className="text-sm font-bold text-white leading-6">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AuthPageShell: React.FC<{
  backLabel?: string;
  onBack?: () => void;
  headerBadge: string;
  title: React.ReactNode;
  description: React.ReactNode;
  desktopAside?: React.ReactNode;
  children: React.ReactNode;
  footerCards?: AuthInfoCardItem[];
  footerGridClassName?: string;
  contentMaxWidthClassName?: string;
  headerClassName?: string;
}> = ({
  backLabel,
  onBack,
  headerBadge,
  title,
  description,
  desktopAside,
  children,
  footerCards,
  footerGridClassName,
  contentMaxWidthClassName,
  headerClassName,
}) => {
  if (desktopAside) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-black overflow-hidden font-sans text-gray-900 dark:text-white">
        {desktopAside}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-8 sm:px-8 lg:px-10 bg-gray-50 dark:bg-black relative">
          <div className="absolute top-16 right-[-10%] h-56 w-56 rounded-full bg-primary/10 blur-[140px] pointer-events-none"></div>
          <div className="absolute bottom-8 left-[-10%] h-48 w-48 rounded-full bg-white/5 blur-[120px] pointer-events-none"></div>

          <div className={cn('w-full relative z-10', contentMaxWidthClassName ?? 'max-w-md')}>
            {backLabel && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold mb-12 group"
              >
                <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                {backLabel}
              </button>
            )}

            <AuthHeader
              badge={headerBadge}
              title={title}
              description={description}
              className={headerClassName ?? 'mb-10'}
            />

            {children}
            {footerCards && <AuthInfoCards items={footerCards} gridClassName={footerGridClassName} />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white overflow-x-hidden">
      <div className={cn('relative mx-auto px-6 py-8 sm:px-8 lg:px-10 lg:py-12', contentMaxWidthClassName ?? 'max-w-3xl')}>
        <div className="pointer-events-none absolute top-16 right-[-8%] h-64 w-64 rounded-full bg-primary/10 blur-[150px]"></div>
        <div className="pointer-events-none absolute bottom-12 left-[-10%] h-56 w-56 rounded-full bg-white/5 blur-[130px]"></div>

        {backLabel && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold mb-12 group"
          >
            <ChevronLeft size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
            {backLabel}
          </button>
        )}

        <AuthHeader
          badge={headerBadge}
          title={title}
          description={description}
          className={headerClassName ?? 'mb-16'}
        />

        {children}
        {footerCards && <AuthInfoCards items={footerCards} gridClassName={footerGridClassName} />}
      </div>
    </div>
  );
};

export const AuthSectionHeader: React.FC<{
  icon: LucideIcon;
  title: string;
  className?: string;
}> = ({ icon: Icon, title, className }) => (
  <div
    className={cn(
      'flex items-center space-x-2 text-gray-500 dark:text-neutral-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100 dark:border-neutral-900 pb-4',
      className,
    )}
  >
    <Icon size={14} className="text-primary" />
    <span>{title}</span>
  </div>
);

export const AuthField: React.FC<{
  label: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, children, className }) => (
  <div className={cn('space-y-3', className)}>
    <label className="inline-block ml-1 text-[11px] font-black tracking-[0.2em] text-gray-500 dark:text-neutral-500">{label}</label>
    {children}
  </div>
);

interface AuthTextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: LucideIcon;
  inputSize?: 'md' | 'lg';
}

export const AuthTextInput = forwardRef<HTMLInputElement, AuthTextInputProps>(
  ({ className, icon: Icon, inputSize = 'md', ...props }, ref) => (
    <div
      className={cn(
        'group flex items-center rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-black/40 px-5 transition-all duration-300 focus-within:border-primary/40 focus-within:bg-white dark:focus-within:bg-neutral-950',
        inputSize === 'lg' ? 'h-16' : 'h-14',
      )}
    >
      {Icon && (
        <Icon size={18} className="mr-4 text-gray-400 dark:text-neutral-600 transition-colors duration-300 group-focus-within:text-primary" />
      )}
      <input
        ref={ref}
        {...props}
        className={cn(
          'auth-input h-full w-full bg-transparent text-base font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-neutral-600 outline-none',
          className,
        )}
      />
    </div>
  ),
);

AuthTextInput.displayName = 'AuthTextInput';

export const AuthPrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => (
  <button
    {...props}
    className={cn(
      'flex h-16 w-full items-center justify-center rounded-[1.75rem] border border-primary/30 bg-primary text-[15px] font-black tracking-[0.2em] text-black shadow-[0_20px_40px_rgba(29,185,84,0.2)] transition-all hover:translate-y-[-2px] hover:shadow-[0_25px_50px_rgba(29,185,84,0.35)] active:translate-y-[0px] disabled:cursor-not-allowed disabled:opacity-70',
      className,
    )}
  >
    {children}
  </button>
);

export const AuthSecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className,
  children,
  ...props
}) => (
  <button
    {...props}
    className={cn(
      'flex h-14 w-full items-center justify-center rounded-[1.5rem] border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-white/5 text-[12px] font-black tracking-[0.12em] text-gray-500 dark:text-neutral-400 transition-all duration-300 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-900 dark:hover:text-white',
      className,
    )}
  >
    {children}
  </button>
);

export const AuthStepper: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}> = ({ value, onChange, min = 0, max = 100, className }) => {
  const decrement = () => onChange(Math.max(min, value - 1));
  const increment = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn('flex items-center', className)}>
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-[3rem] text-center text-base font-bold text-gray-900 dark:text-white tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-black/40 text-gray-600 dark:text-neutral-300 transition-all hover:border-gray-300 dark:hover:border-neutral-600 hover:text-gray-900 dark:hover:text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
