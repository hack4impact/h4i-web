import { describe, expect, it } from "vitest";
import { allowedProjectOrigin } from "./security";

describe("project write origin checks", () => {
  const req = (method: string, origin?: string, site?: string) =>
    new Request("https://app.example.org/api/projects", {
      method,
      headers: {
        ...(origin ? { origin } : {}),
        ...(site ? { "sec-fetch-site": site } : {}),
      },
    });
  it.each(["POST", "PATCH", "DELETE"])(
    "blocks cross-origin %s, including same-site sibling origins",
    (method) => {
      expect(allowedProjectOrigin(req(method, "https://app.example.org"))).toBe(
        true
      );
      expect(
        allowedProjectOrigin(
          req(method, "https://attacker.example.org", "same-site")
        )
      ).toBe(false);
      expect(
        allowedProjectOrigin(req(method, "https://untrusted.invalid"))
      ).toBe(false);
      expect(allowedProjectOrigin(req(method, "null"))).toBe(false);
    }
  );
  it("supports CLI callers and the configured reverse-proxy origin", () => {
    expect(allowedProjectOrigin(req("POST"))).toBe(true);
    expect(allowedProjectOrigin(req("POST", undefined, "cross-site"))).toBe(
      false
    );
    const proxy = new Request("http://internal:3000/api/projects", {
      method: "POST",
      headers: { origin: "https://public.example.org" },
    });
    expect(
      allowedProjectOrigin(proxy, "https://public.example.org/some-path")
    ).toBe(true);
    expect(allowedProjectOrigin(proxy, "not-a-url")).toBe(false);
  });
  it("does not substitute origin checks for authenticated read permissions", () => {
    expect(allowedProjectOrigin(req("GET", "https://untrusted.invalid"))).toBe(
      true
    );
  });
});
