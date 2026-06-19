import type { ChipVariant } from '../components/ui/status-chip';

export function gameStatusVariant(status: string): ChipVariant {
  switch (status) {
    case 'PLAYING':
      return 'playing';
    case 'PAUSED':
      return 'paused';
    case 'FINISHED':
      return 'finished';
    case 'READY':
      return 'ready';
    default:
      return 'neutral';
  }
}
