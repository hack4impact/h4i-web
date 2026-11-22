import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { ProjectApiError } from "./http";

export const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const types = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;
export function mediaKind(bytes: Uint8Array, mime: string): string | null {
  const starts = (...prefix: number[]) =>
    prefix.every((value, index) => bytes[index] === value);
  const ascii = (start: number, end: number) =>
    Buffer.from(bytes.subarray(start, end)).toString("ascii");
  const valid =
    mime === "image/png"
      ? starts(137, 80, 78, 71, 13, 10, 26, 10)
      : mime === "image/jpeg"
        ? starts(255, 216, 255)
        : mime === "image/gif"
          ? ["GIF87a", "GIF89a"].includes(ascii(0, 6))
          : mime === "image/webp"
            ? ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
            : mime === "video/webm"
              ? starts(26, 69, 223, 163)
              : mime === "video/mp4"
                ? ascii(4, 8) === "ftyp" &&
                  [
                    "isom",
                    "iso2",
                    "mp41",
                    "mp42",
                    "avc1",
                    "M4V ",
                    "MSNV",
                  ].includes(ascii(8, 12))
                : false;
  return valid ? types[mime as keyof typeof types] : null;
}
function folder(projectId: string) {
  if (!/^[\w-]+$/.test(projectId))
    throw new ProjectApiError(404, "Media not found");
  // Uploads are runtime data on a persistent volume, never build artifacts.
  return path.join(
    /* turbopackIgnore: true */
    process.env.PROJECT_MEDIA_DIR ||
      path.join(process.cwd(), ".data", "project-media"),
    projectId
  );
}
export async function uploadedFile(request: Request): Promise<File> {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data;"))
    throw new ProjectApiError(400, "Upload a file using multipart/form-data");
  const limit = MAX_MEDIA_BYTES + 1024 * 1024;
  if (Number(request.headers.get("content-length")) > limit)
    throw new ProjectApiError(413, "Media must be 20 MB or smaller");
  if (!request.body) throw new ProjectApiError(400, "Choose a file");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new ProjectApiError(413, "Media must be 20 MB or smaller");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  let data: FormData;
  try {
    data = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new ProjectApiError(400, "Invalid upload");
  }
  const file = data.get("file");
  if (!(file instanceof File) || file.size === 0)
    throw new ProjectApiError(400, "Choose a non-empty file");
  if (file.size > MAX_MEDIA_BYTES)
    throw new ProjectApiError(413, "Media must be 20 MB or smaller");
  return file;
}
export async function storeMedia(projectId: string, file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = mediaKind(bytes, file.type);
  if (!extension)
    throw new ProjectApiError(
      400,
      "Use a valid PNG, JPEG, WebP, GIF, MP4 or WebM file"
    );
  const directory = folder(projectId);
  await mkdir(directory, { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  await writeFile(
    path.join(/* turbopackIgnore: true */ directory, name),
    bytes,
    { flag: "wx" }
  );
  return {
    url: `/api/projects/${encodeURIComponent(projectId)}/media/${name}`,
  };
}
export async function serveMedia(
  projectId: string,
  name: string,
  range: string | null
) {
  if (!/^[\da-f-]{36}\.(png|jpg|webp|gif|mp4|webm)$/.test(name))
    throw new ProjectApiError(404, "Media not found");
  const file = path.join(/* turbopackIgnore: true */ folder(projectId), name);
  let size: number;
  try {
    size = (await stat(/* turbopackIgnore: true */ file)).size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new ProjectApiError(404, "Media not found");
    throw error;
  }
  // Read permissions are checked by the route before touching the file.
  const extension = path.extname(name).slice(1);
  const mime = Object.entries(types).find(([, ext]) => ext === extension)![0];
  const headers: Record<string, string> = {
    "Content-Type": mime,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
    "Content-Security-Policy": "default-src 'none'; sandbox",
  };
  let start = 0,
    end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2]))
      return new Response(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${size}` },
      });
    start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
    end =
      match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start > end ||
      start >= size
    )
      return new Response(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${size}` },
      });
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  const stream = Readable.toWeb(
    createReadStream(/* turbopackIgnore: true */ file, { start, end })
  ) as ReadableStream<Uint8Array>;
  return new Response(stream, { status: range ? 206 : 200, headers });
}
