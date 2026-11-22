import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ assertRole: vi.fn(), partners: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({
  assertRole: mocks.assertRole,
  assertSession: vi.fn(),
}));
vi.mock("@/lib/notion/api", () => ({ getPartnerReferences: mocks.partners }));
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertRole.mockResolvedValue({
    user: { id: "editor", role: "PROJECT_LEAD", chapterId: "c" },
  });
});
afterEach(() => vi.unstubAllEnvs());
describe("Partner Directory reference search", () => {
  it("uses the canonical directory and matches names case-insensitively", async () => {
    vi.stubEnv("NOTION_API_KEY", "test-only-key");
    mocks.partners.mockResolvedValue([
      { id: "p1", name: "Food Bank", photo: null },
      { id: "p2", name: "Library", photo: null },
    ]);
    const response = await GET(
      new Request("http://localhost/api/projects/references/partners?q=FOOD")
    );
    expect(await response.json()).toEqual({
      available: true,
      partners: [{ id: "p1", name: "Food Bank", photo: null }],
    });
    expect(mocks.partners).toHaveBeenCalledOnce();
  });
  it("enables free-text fallback when the directory is unconfigured or offline", async () => {
    vi.stubEnv("NOTION_API_KEY", "");
    expect(
      await (
        await GET(
          new Request(
            "http://localhost/api/projects/references/partners?q=Food"
          )
        )
      ).json()
    ).toEqual({ available: false, partners: [] });
    expect(mocks.partners).not.toHaveBeenCalled();
    vi.stubEnv("NOTION_API_KEY", "test-only-key");
    mocks.partners.mockRejectedValue(new Error("Unavailable"));
    expect(
      await (
        await GET(
          new Request(
            "http://localhost/api/projects/references/partners?q=Food"
          )
        )
      ).json()
    ).toEqual({ available: false, partners: [] });
  });
  it("requires an editor session and validates query lengths", async () => {
    mocks.assertRole.mockRejectedValueOnce(new Error("Forbidden"));
    expect(
      (
        await GET(
          new Request(
            "http://localhost/api/projects/references/partners?q=Food"
          )
        )
      ).status
    ).toBe(403);
    expect(
      (
        await GET(
          new Request(
            `http://localhost/api/projects/references/partners?q=${"x".repeat(101)}`
          )
        )
      ).status
    ).toBe(400);
  });
});
