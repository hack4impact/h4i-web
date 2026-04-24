import { expect, test, vi } from "vitest";
import { getSession } from "./session";
import { db } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    session: {
      findUnique: vi.fn(),
    },
  },
}));

test("Returns null when no cookie is present", async () => {
  const request = new Request("http://localhost", { headers: {} });
  expect(await getSession(request)).toBe(null);
});

test("Returns null when the cookie contains a session ID not found in the DB", async () => {
  vi.mocked(db.session.findUnique).mockResolvedValueOnce(null);
  const request = new Request("http://localhost", {
    headers: { cookie: "sessionToken=nonexistent-id" },
  });
  expect(await getSession(request)).toBe(null);
});

test("Returns null when the session is expired", async () => {
  vi.mocked(db.session.findUnique).mockResolvedValueOnce({
    expiresAt: new Date(Date.now() - 10000),
    userId: "some-user-id",
  });
  const request = new Request("http://localhost", {
    headers: { cookie: "sessionToken=session-id" },
  });
  expect(await getSession(request)).toBe(null);
});

test("Returns the session with the user attached when valid", async () => {
  vi.mocked(db.session.findUnique).mockResolvedValueOnce({
    expiresAt: new Date(Date.now() + 10000),
    userId: "some-user-id",
  });
  const request = new Request("http://localhost", {
    headers: { cookie: "sessionToken=session-id" },
  });
  const session = await getSession(request);
  expect(session?.userId).toBeDefined();
});
