import type { ProjectPatch } from "./validation";
import type { ProjectSaveResult } from "./client";

// All draft creation/writes are serialized, including manual saves and uploads.
// A response acknowledges a snapshot; it never replaces newer editor input.
export class DraftQueue {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(
    public id: string | null,
    private write: (
      id: string | null,
      fields: ProjectPatch
    ) => Promise<ProjectSaveResult>
  ) {}
  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const next = this.tail.then(work);
    this.tail = next.catch(() => undefined);
    return next;
  }
  save(fields: ProjectPatch) {
    const snapshot = structuredClone(fields);
    return this.enqueue(async () => {
      const saved = await this.write(this.id, snapshot);
      this.id = saved.id;
      return saved;
    });
  }
  ensureId(minimum: ProjectPatch) {
    return this.enqueue(async () => {
      if (!this.id) this.id = (await this.write(null, minimum)).id;
      return this.id;
    });
  }
  run<T>(work: (id: string) => Promise<T>) {
    return this.enqueue(() => {
      if (!this.id) throw new Error("Save this draft first.");
      return work(this.id);
    });
  }
}
