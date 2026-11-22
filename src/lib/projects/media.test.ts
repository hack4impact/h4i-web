import { describe, expect, it } from "vitest";
import { mediaKind } from "./media";

describe("project upload format checks", () => {
  it("matches content signatures to the declared media type", () => {
    expect(
      mediaKind(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png")
    ).toBe("png");
    expect(mediaKind(Uint8Array.from([255, 216, 255, 0]), "image/jpeg")).toBe(
      "jpg"
    );
    expect(mediaKind(Buffer.from("GIF89a"), "image/gif")).toBe("gif");
    expect(mediaKind(Buffer.from("RIFF1234WEBP"), "image/webp")).toBe("webp");
    expect(mediaKind(Uint8Array.from([26, 69, 223, 163]), "video/webm")).toBe(
      "webm"
    );
    expect(mediaKind(Buffer.from("1234ftypisom"), "video/mp4")).toBe("mp4");
  });
  it("rejects renamed HTML, unsupported formats and mismatched MIME types", () => {
    expect(
      mediaKind(Buffer.from("<html>not an image</html>"), "image/png")
    ).toBeNull();
    expect(mediaKind(Buffer.from("<svg/>"), "image/svg+xml")).toBeNull();
    expect(mediaKind(Uint8Array.from([255, 216, 255]), "video/mp4")).toBeNull();
    expect(mediaKind(new Uint8Array(), "image/png")).toBeNull();
  });
});
