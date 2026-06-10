"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { TEXT_CLASS } from "@/lib/constants";

interface Testimonial {
  quote: string;
  name: string;
  title?: string;
}

interface TestimonialBlockProps {
  testimonials: Testimonial[];
  color?: string;
}

const containerVariants = staggerContainer(0.15, false);
const itemVariants = fadeInUp();

export function TestimonialBlock({
  testimonials,
  color = "blue",
}: TestimonialBlockProps) {
  const single = testimonials.length === 1;

  return (
    <section className="page-section md:py-24">
      <motion.div
        className="section-inner"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.p
          variants={itemVariants}
          className={cn("label mb-10", TEXT_CLASS[color])}
        >
          In their words
        </motion.p>

        <div
          className={
            single
              ? "max-w-[680px]"
              : "grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-16 md:gap-y-12"
          }
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex flex-col"
            >
              <blockquote className="heading-card leading-[36px]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="border-separator mt-8 border-t pt-6">
                <p className="text-inverse font-sans text-[15px] leading-[18px] font-medium">
                  {t.name}
                </p>
                {t.title && (
                  <p className="label-xs text-gray-4 mt-1">{t.title}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
