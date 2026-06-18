import { Link } from 'react-router-dom';
import { Card, PageShell, PrimaryButton } from '../components/ui/layout';
import { useSessionStore } from '../stores/session';

export function HomePage() {
  const recent = useSessionStore((s) => s.recentEvents);

  return (
    <PageShell title="PitchMaster">
      <PrimaryButton>
        <Link to="/events/new" className="block w-full">
          + 新建活动
        </Link>
      </PrimaryButton>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textSec">最近活动</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-textSec">还没有活动，点上方按钮创建一个。</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((e) => (
              <li key={e.shortCode}>
                <Link
                  to={`/events/${e.shortCode}`}
                  className="flex items-center justify-between rounded-xl bg-chipBg px-3 py-3"
                >
                  <span className="font-medium">{e.name}</span>
                  <span className="font-mono text-xs text-textSec">{e.shortCode}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageShell>
  );
}
