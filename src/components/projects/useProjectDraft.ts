"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DraftQueue } from "@/lib/projects/draft-queue";
import { projectClient } from "@/lib/projects/client";
import {
  autosaveValue,
  formErrors,
  formPayload,
  type ProjectFormValue,
} from "@/lib/projects/form";
import type { ProjectPatch } from "@/lib/projects/validation";

export function useProjectDraft(
  value: ProjectFormValue,
  initialId: string | null,
  disabled: boolean
) {
  const [queue] = useState(() => new DraftQueue(initialId, projectClient.save));
  const key = JSON.stringify(formPayload(autosaveValue(value)));
  const invalid = Object.keys(formErrors(autosaveValue(value))).length > 0;
  const [ack, setAck] = useState({
    key,
    id: initialId,
    savedAt: null as number | null,
  });
  const [pending, setPending] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [now, setNow] = useState(Date.now);
  const suspended = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const dirty = ack.key !== key;
  const recordId = useCallback((id: string) => {
    if (!mounted.current) return;
    setAck((previous) => ({ ...previous, id }));
    if (window.location.pathname === "/projects/new")
      window.history.replaceState(
        null,
        "",
        `/projects/${encodeURIComponent(id)}/edit`
      );
  }, []);
  const persist = useCallback(
    async (fields: ProjectPatch, snapshotKey: string) => {
      setPending((n) => n + 1);
      setError(null);
      try {
        const saved = await queue.save(fields);
        if (mounted.current) {
          setError(null);
          setAck({ id: saved.id, key: snapshotKey, savedAt: Date.now() });
        }
        recordId(saved.id);
        return saved;
      } catch (failure) {
        if (mounted.current)
          setError(
            failure instanceof Error
              ? failure
              : new Error("Draft could not be saved.")
          );
        throw failure;
      } finally {
        if (mounted.current) setPending((n) => n - 1);
      }
    },
    [queue, recordId]
  );
  useEffect(() => {
    if (disabled || suspended.current || !dirty || invalid) return;
    const timer = setTimeout(() => {
      if (!suspended.current)
        void persist(JSON.parse(key), key).catch(() => undefined);
    }, 750);
    return () => clearTimeout(timer);
  }, [key, disabled, dirty, invalid, persist]);
  useEffect(() => {
    if (!ack.savedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [ack.savedAt]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const minutes = ack.savedAt
    ? Math.max(0, Math.floor((now - ack.savedAt) / 60000))
    : 0;
  const status = pending
    ? "Saving draft…"
    : dirty && invalid
      ? "Autosave paused · Check incomplete or invalid fields"
      : error
        ? "Draft not saved · Retry Save Draft"
        : dirty
          ? "Unsaved changes"
          : ack.savedAt
            ? `Draft saved · ${minutes ? `${minutes} min ago` : "Just now"}`
            : initialId
              ? "Draft loaded"
              : "Start typing to save a draft";
  return {
    isActive: () => mounted.current,
    id: ack.id,
    status,
    error,
    dirty,
    suspend: () => {
      suspended.current = true;
    },
    resume: () => {
      suspended.current = false;
    },
    save: () => persist(formPayload(autosaveValue(value)), key),
    publish: () => queue.run(projectClient.publish),
    ensureId: async () => {
      const id = await queue.ensureId({
        name: value.name,
        chapterId: value.chapterId,
        stage: value.stage,
      });
      recordId(id);
      return id;
    },
  };
}
