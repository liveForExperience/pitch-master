import { Link } from 'react-router-dom';

export function PageShell({
  title,
  backTo,
  children,
}: {
  title: string;
  backTo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-full max-w-md bg-elevated pb-8">
      <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-3">
          {backTo && (
            <Link to={backTo} className="text-sm text-primary">
              ← 返回
            </Link>
          )}
          <h1 className="flex-1 truncate text-lg font-bold text-textPri">{title}</h1>
        </div>
      </header>
      <main className="space-y-4 p-4">{children}</main>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-4 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 w-full rounded-2xl bg-primary px-4 py-3 text-base font-bold text-textInv active:bg-primaryDk disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
