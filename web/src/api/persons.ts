import { apiRequest } from './client';
import type { Person } from './types';

export const listPersons = () => apiRequest<{ persons: Person[] }>('/api/persons');

export const createPerson = (displayName: string) =>
  apiRequest<Person>('/api/persons', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  });

export const renamePerson = (personId: string, displayName: string) =>
  apiRequest<Person>(`/api/persons/${personId}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
