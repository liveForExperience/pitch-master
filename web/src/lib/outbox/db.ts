import type { OutboxItem, OutboxItemStatus } from './types';

const DB_NAME = 'pitchmaster-outbox';
const STORE = 'outbox';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error('Failed to open outbox DB'));
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('by_game', 'gameId', { unique: false });
        store.createIndex('by_status', 'status', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function runTx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const store = tx.objectStore(STORE);
        const req = fn(store);
        req.onerror = () => reject(req.error ?? new Error('Outbox DB request failed'));
        req.onsuccess = () => resolve(req.result as T);
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error ?? new Error('Outbox DB transaction failed'));
      }),
  );
}

export async function addOutboxItem(item: OutboxItem): Promise<void> {
  await runTx('readwrite', (store) => store.add(item));
}

export async function updateOutboxItem(item: OutboxItem): Promise<void> {
  await runTx('readwrite', (store) => store.put(item));
}

export async function removeOutboxItems(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        for (const id of ids) store.delete(id);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error ?? new Error('Outbox delete failed'));
      }),
  );
}

export async function listOutboxItems(): Promise<OutboxItem[]> {
  const items = await runTx<OutboxItem[]>('readonly', (store) => store.getAll());
  const stuck = items.filter((i) => i.status === 'SENDING');
  if (stuck.length === 0) return items;

  await Promise.all(
    stuck.map((item) => updateOutboxItem({ ...item, status: 'PENDING' as OutboxItemStatus })),
  );
  return runTx<OutboxItem[]>('readonly', (store) => store.getAll());
}
