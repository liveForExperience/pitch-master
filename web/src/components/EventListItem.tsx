import { Link } from 'react-router-dom';

export function EventListItem({ name, shortCode }: { name: string; shortCode: string }) {
  return (
    <Link
      to={`/events/${shortCode}`}
      className="flex items-center justify-between py-3 active:bg-elevated"
    >
      <span className="font-medium text-textPri">{name}</span>
      <span className="font-mono text-xs text-textSec">{shortCode}</span>
    </Link>
  );
}
