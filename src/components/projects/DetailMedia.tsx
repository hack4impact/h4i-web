"use client";

import { useState } from "react";

export function DetailImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-gray-3">Image unavailable</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
export function DetailMedia({ src, index }: { src: string; index: number }) {
  return (
    <figure className="border-separator rounded-6 overflow-hidden border">
      {/\.(mp4|webm)(?:[?#]|$)/i.test(src) ? (
        <video
          src={src}
          controls
          preload="metadata"
          className="bg-panel aspect-video w-full"
          aria-label={`Demo video ${index + 1}`}
        />
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
