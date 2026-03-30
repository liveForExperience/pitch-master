import apiClient from './client';
import type { AdminUser } from './tournament';

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const adminApi = {
  searchUsers: (q: string, page = 1, pageSize = 10): Promise<PageResult<AdminUser>> =>
    apiClient.get(`/api/admin/users/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`),
};
