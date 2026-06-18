export type HealthResponse = {
  status: 'ok';
  service: string;
  version: string;
  uptimeSeconds: number;
  serverTime: string;
};

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch('/api/health', { signal });
  if (!res.ok) {
    throw new Error(`health check failed: ${res.status}`);
  }
  return (await res.json()) as HealthResponse;
}
