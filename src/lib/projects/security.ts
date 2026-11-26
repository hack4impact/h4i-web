const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

// Browser requests declare their Origin; CLI/API callers may omit it. PUBLIC_URL
// supports the canonical browser origin when a reverse proxy uses an internal URL.
export function allowedProjectOrigin(
  request: Request,
  publicUrl?: string
): boolean {
  if (safeMethods.has(request.method.toUpperCase())) return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([new URL(request.url).origin]);
  if (publicUrl) {
    try {
      allowed.add(new URL(publicUrl).origin);
    } catch {
      /* Invalid configuration grants no additional origin. */
    }
  }
  return allowed.has(origin);
}
