import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildContentfulImageUrl(
  baseUrl: string,
  options: {
    w?: number;
    h?: number;
    q?: number;
  }
) {
  const url = new URL(baseUrl);
  if (options.w) url.searchParams.set("w", options.w.toString());
  if (options.h) url.searchParams.set("h", options.h.toString());
  if (options.q) url.searchParams.set("q", options.q.toString());
  url.searchParams.set("fm", "webp"); // Always request WebP format
  return url.toString();
}
