import { describe, expect, it } from "vitest";
import { partnerFromNotion } from "./partner-reference";

describe("Partner Directory projection", () => {
  it("returns only canonical ID, name and optional logo, never contact data", () => {
    const partner = partnerFromNotion({
      id: "partner-1",
      properties: {
        Name: {
          type: "title",
          title: [{ plain_text: "Community " }, { plain_text: "Center" }],
        },
        Email: { type: "email", email: "private@example.org" },
        Logo: {
          type: "files",
          files: [{ external: { url: "https://example.org/logo.png" } }],
        },
      },
    });
    expect(partner).toEqual({
      id: "partner-1",
      name: "Community Center",
      photo: "https://example.org/logo.png",
    });
    expect(JSON.stringify(partner)).not.toContain("private@example.org");
  });
  it("handles missing names and ignores unsafe image URL schemes", () => {
    expect(partnerFromNotion({ id: "p", properties: {} })).toBeNull();
    expect(partnerFromNotion(null)).toBeNull();
    expect(
      partnerFromNotion({
        id: "p",
        properties: { Name: { title: [{ plain_text: "Partner" }] } },
        icon: { external: { url: "javascript:alert(1)" } },
      })
    ).toEqual({ id: "p", name: "Partner", photo: null });
  });
});
