"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button, ButtonColor } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { GRADIENT_CLASS, TEXT_CLASS } from "@/lib/constants";

interface HeroBannerProps {
  label: string;
  heading: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  color?: string;
  image?: string;
  alt?: string;
  imageClassName?: string;
  contentClassName?: string;
}

export function HeroBanner({
  label,
  heading,
  description,
  buttonText,
  buttonHref,
  color = "blue",
  image,
  alt,
  imageClassName,
  contentClassName,
}: HeroBannerProps) {
  return (
    <section
      className={cn(
        GRADIENT_CLASS[color] ?? "gradient-tr-blue",
        "border-separator relative overflow-hidden border-b"
      )}
    >
      <div
        className={cn(
          "relative mx-auto px-8 md:px-16",
          image ? "grid md:grid-cols-2 md:gap-16" : "pt-14 pb-14"
        )}
      >
        <div className={cn(image && "pt-14 pb-14", contentClassName)}>
          <p className={cn("label mb-5", TEXT_CLASS[color])}>
            Get Involved · {label}
          </p>
          <h1 className="heading-display mb-4">{heading}</h1>
          <p className="text-gray-3 max-w-2xl font-sans text-base leading-6">
            {description}
          </p>
          {buttonText && buttonHref && (
            <div className="mt-8">
              <Link target="_blank" rel="noopener noreferrer" href={buttonHref}>
                <Button color={color as ButtonColor}>{buttonText}</Button>
              </Link>
            </div>
          )}
        </div>

        {image ? (
          <motion.div
            className="hidden h-full md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.3 } }}
          >
            <div className="relative mr-8 h-full md:mr-16">
              <Image
                fill
                src={image}
                alt={alt ?? ""}
                className={cn("object-contain object-bottom", imageClassName)}
                sizes="50vw"
                priority
              />
            </div>
          </motion.div>
        ) : (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 left-1/2 hidden overflow-hidden select-none md:flex md:items-center md:justify-end md:pr-8 lg:pr-16"
            aria-hidden="true"
          >
            <span
              className={cn(
                "font-serif text-[100px] leading-none font-light tracking-[-0.02em] opacity-[0.12]",
                TEXT_CLASS[color]
              )}
            >
              {label}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
