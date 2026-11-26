"use client";

import { useState } from "react";

export function DetailImage({
  src,
  alt,
  className,
  fallback = "Image unavailable",
}: {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <span className="text-gray-3">{fallback}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailedSrc(src)}
    />
  );
}
export function DetailMedia({ src, index }: { src: string; index: number }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return (
    <figure className="border-separator rounded-6 overflow-hidden border">
      {/\.(mp4|webm)(?:[?#]|$)/i.test(src) ? (
        failedSrc === src ? (
          <p className="text-gray-3 p-20">
            Video unavailable. You can try opening the original below.
          </p>
        ) : (
          <video
            src={src}
            onError={() => setFailedSrc(src)}
            controls
            preload="metadata"
            className="bg-panel aspect-video w-full"
            aria-label={`Demo video ${index + 1}`}
          />
        )
      ) : (
        <DetailImage
          src={src}
          alt={`Demo photo ${index + 1}`}
          className="bg-panel aspect-video w-full object-contain"
        />
      )}
      <figcaption className="p-12">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Open media {index + 1}
        </a>
      </figcaption>
    </figure>
  );
}
