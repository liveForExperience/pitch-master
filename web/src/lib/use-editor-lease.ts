import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../api/parse-response';
import { claimEditorLease, releaseEditorLease } from '../api/events';
import type { EditorState } from '../api/types';
import { EDITOR_LEASE_RENEW_MS } from './editor-lease-config';
import { getOrCreateDeviceId } from './device-id';

type EditorLeaseConflict = {
  holderDeviceId: string | null;
  expiresAt: number | null;
};

function parseLeaseConflict(data: unknown): EditorLeaseConflict {
  if (data && typeof data === 'object') {
    const row = data as EditorLeaseConflict;
    return {
      holderDeviceId: row.holderDeviceId ?? null,
      expiresAt: row.expiresAt ?? null,
    };
  }
  return { holderDeviceId: null, expiresAt: null };
}

export function useEditorLease(
  gameId: string,
  adminToken: string | null,
  enabled: boolean,
) {
  const deviceId = useMemo(() => getOrCreateDeviceId(), []);
  const [editor, setEditor] = useState<EditorState>({
    deviceId: null,
    expiresAt: null,
    isHeldByMe: false,
  });
  const [busy, setBusy] = useState(false);
  const heldRef = useRef(false);
  heldRef.current = editor.isHeldByMe;

  const claim = useCallback(
    async (force = false) => {
      if (!adminToken || !gameId) return false;
      setBusy(true);
      try {
        const result = await claimEditorLease(gameId, adminToken, { force, deviceId });
        setEditor({
          deviceId,
          expiresAt: result.expiresAt,
          isHeldByMe: true,
        });
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.code === 'editor_lease_required') {
          const conflict = parseLeaseConflict(err.data);
          setEditor({
            deviceId: conflict.holderDeviceId,
            expiresAt: conflict.expiresAt,
            isHeldByMe: false,
          });
          return false;
        }
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [adminToken, deviceId, gameId],
  );

  const release = useCallback(async () => {
    if (!adminToken || !gameId) return;
    try {
      await releaseEditorLease(gameId, adminToken, deviceId);
    } catch {
      /* best-effort */
    }
    setEditor({ deviceId: null, expiresAt: null, isHeldByMe: false });
  }, [adminToken, deviceId, gameId]);

  const syncFromDetail = useCallback((detailEditor?: EditorState) => {
    if (!detailEditor) return;
    setEditor(detailEditor);
  }, []);

  useEffect(() => {
    if (!enabled || !adminToken || !gameId) return;
    void claim();
  }, [enabled, adminToken, gameId, claim]);

  useEffect(() => {
    if (!enabled || !adminToken || !gameId || !editor.isHeldByMe) return;
    const renewTimer = window.setInterval(() => {
      void claim();
    }, EDITOR_LEASE_RENEW_MS);
    return () => window.clearInterval(renewTimer);
  }, [enabled, adminToken, gameId, editor.isHeldByMe, claim]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      if (heldRef.current) void release();
    };
  }, [enabled, release]);

  return {
    deviceId,
    editor,
    busy,
    canControlTimer: editor.isHeldByMe,
    claim,
    release,
    syncFromDetail,
  };
}
