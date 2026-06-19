import { cn } from '../../lib/cn';

export function Section({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg leading-none text-primary">{icon}</span>}
        <h2 className="text-h2 font-bold text-textPri">{title}</h2>
      </div>
      {children}
    </div>
  );
}
