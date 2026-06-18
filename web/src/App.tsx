import { useEffect, useState } from 'react';
import { fetchHealth, type HealthResponse } from './api/health';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string };

export function App() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchHealth(ctrl.signal)
      .then((data) => setState({ kind: 'ok', data }))
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setState({ kind: 'error', message: err.message });
      });
    return () => ctrl.abort();
  }, []);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-pitch-accent">PitchMaster</h1>
        <p className="mt-1 text-sm text-pitch-muted">v2 · 球场速记 · 脚手架就绪</p>
      </header>

      <section className="w-full rounded-2xl border border-pitch-line bg-pitch-surface p-5 shadow-lg">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-pitch-muted">
          后端联通性
        </h2>

        {state.kind === 'loading' && (
          <p className="text-sm text-pitch-muted">检测中…</p>
        )}

        {state.kind === 'ok' && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-pitch-muted">状态</dt>
            <dd className="font-mono text-pitch-accent">{state.data.status}</dd>
            <dt className="text-pitch-muted">服务</dt>
            <dd className="font-mono">{state.data.service}</dd>
            <dt className="text-pitch-muted">版本</dt>
            <dd className="font-mono">{state.data.version}</dd>
            <dt className="text-pitch-muted">已运行</dt>
            <dd className="font-mono">{state.data.uptimeSeconds}s</dd>
            <dt className="text-pitch-muted">服务器时间</dt>
            <dd className="break-all font-mono text-xs">{state.data.serverTime}</dd>
          </dl>
        )}

        {state.kind === 'error' && (
          <p className="text-sm text-pitch-danger">
            ✘ 连不上 backend：{state.message}
            <br />
            <span className="text-xs text-pitch-muted">
              先在另一个终端跑 <code className="font-mono">cd backend &amp;&amp; npm run dev</code>
            </span>
          </p>
        )}
      </section>

      <footer className="text-center text-xs text-pitch-muted">
        Phase 0 · T0.4 · scaffold ✓
      </footer>
    </main>
  );
}
