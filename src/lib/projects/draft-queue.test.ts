import { describe, expect, it, vi } from "vitest";
import { DraftQueue } from "./draft-queue";
import type { ProjectPatch } from "./validation";

describe("draft write serialization", () => {
  it("creates once while typing during an in-flight request, then patches newer snapshots", async () => {
    let release!: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    const write = vi.fn(async (id: string | null, fields: ProjectPatch) => {
      if (!id) await hold;
      return { ...fields, id: id || "draft-1", isDraft: true };
    });
    const queue = new DraftQueue(null, write);
    const first = queue.save({ name: "First" });
    const second = queue.save({ name: "Latest" });
    await Promise.resolve();
    expect(write).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
    expect(write.mock.calls.map(([id, fields]) => [id, fields.name])).toEqual([
      [null, "First"],
      ["draft-1", "Latest"],
    ]);
  });
  it("uploads reuse a draft being created by autosave", async () => {
    const write = vi.fn(async (id: string | null, fields: ProjectPatch) => ({
      ...fields,
      id: id || "draft",
      isDraft: true,
    }));
    const queue = new DraftQueue(null, write);
    await Promise.all([
      queue.save({ name: "Draft" }),
      queue.ensureId({ name: "Minimum" }),
    ]);
    expect(write).toHaveBeenCalledTimes(1);
  });
  it("copies queued data and publishes only after its final save", async () => {
    const events: string[] = [];
    const queue = new DraftQueue("draft", async (id, fields) => {
      events.push(fields.name!);
      return { ...fields, id: id!, isDraft: true };
    });
    const fields = { name: "Original" };
    const saved = queue.save(fields);
    fields.name = "Changed locally";
    const published = queue.run(async () => {
      events.push("publish");
    });
    await Promise.all([saved, published]);
    expect(events).toEqual(["Original", "publish"]);
  });
  it("allows retry after a failed save without poisoning later operations", async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ id: "draft", isDraft: true });
    const queue = new DraftQueue(null, write);
    await expect(queue.save({ name: "Draft" })).rejects.toThrow("Offline");
    await expect(queue.save({ name: "Retry" })).resolves.toMatchObject({
      id: "draft",
    });
  });
});
