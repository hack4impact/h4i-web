import { describe, expect, it } from "vitest";
import { escapeIlikePattern, ilikeContainsPattern } from "./ilike";

describe("escapeIlikePattern", () => {
  it("escapes SQL ILIKE wildcards and backslashes for literal matching", () => {
    expect(escapeIlikePattern("100%_ready\\now")).toBe("100\\%\\_ready\\\\now");
    expect(ilikeContainsPattern("a%b_c")).toBe("%a\\%b\\_c%");
  });

  it("leaves ordinary keyword characters unchanged", () => {
    expect(escapeIlikePattern("civic tech")).toBe("civic tech");
    expect(ilikeContainsPattern("React")).toBe("%React%");
  });
});
