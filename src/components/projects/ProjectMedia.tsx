"use client";

import { useState } from "react";

export function ProjectImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="bg-panel text-gray-3 rounded-6 flex min-h-80 items-center justify-center p-16">
        Image unavailable
      </div>
    );
  // External directory logos and uploaded images can use any http(s) host.
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

export function ProjectMedia({ src, index }: { src: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const video = /\.(mp4|webm|og[gv]|mov)(?:[?#]|$)/i.test(src);
  return (
    <figure className="border-separator rounded-6 overflow-hidden border">
      {video ? (
        failed ? (
          <p className="p-24">Video unavailable</p>
        ) : (
          <video
            src={src}
            controls
            preload="metadata"
            className="bg-panel aspect-video w-full"
            aria-label={`Project demo video ${index + 1}`}
            onError={() => setFailed(true)}
          />
        )
      ) : (
        <ProjectImage
          src={src}
          alt={`Project demo photo ${index + 1}`}
          className="bg-panel aspect-video w-full object-contain"
        />
      )}
      <figcaption className="p-12">
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-2 underline"
        >
          Open {video ? "video" : "photo"} {index + 1}
          <span className="sr-only"> in a new tab</span>
        </a>
      </figcaption>
    </figure>
  );
}
