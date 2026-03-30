import apiClient from './client';
import type { AdminUser } from './tournament';

export const adminApi = {
  searchUsers: (q: string): Promise<AdminUser[]> =>
    apiClient.get(`/api/admin/users/search?q=${encodeURIComponent(q)}`),
};
