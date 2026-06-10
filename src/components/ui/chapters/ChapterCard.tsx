import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Chapter } from "@/lib/types/chapter";

interface ChapterCardProps {
  chapter: Chapter;
  imageUrl: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  Active: "bg-green-500/25 border border-green-400/40 text-white",
  Forming: "bg-orange-500/25 border border-orange-400/40 text-white",
  Inactive: "bg-black/35 border border-white/10 text-white/45",
};

function statusStyle(status: string): string {
  return (
    STATUS_STYLES[status] ?? "bg-black/35 border border-white/10 text-white/60"
  );
}

export function ChapterCard({ chapter, imageUrl }: ChapterCardProps) {
  const location = chapter.location?.toUpperCase() ?? "";
  const est = chapter.founded ? `EST. ${chapter.founded}` : "";
  const meta = [location, est].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/work/chapters/${chapter.slug}`}
      className="group border-checkbox-outline relative block aspect-video overflow-hidden rounded-2xl border bg-blue-50"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Campus of ${chapter.name}`}
          fill
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200" />
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      {/* Status badge */}
      {chapter.status && (
        <div
          className={cn(
            "absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] uppercase backdrop-blur-md",
            statusStyle(chapter.status)
          )}
        >
          {chapter.status}
        </div>
      )}

      {/* Text */}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-sans text-[15px] leading-tight font-normal text-white">
          {chapter.name}
        </p>
        {meta && (
          <p className="mt-1 font-mono text-[9px] tracking-[0.08em] text-white/70 uppercase">
            {meta}
          </p>
        )}
      </div>
    </Link>
  );
}
