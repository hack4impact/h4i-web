"use client";

import { ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { staggerContainer, fadeInForward } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { StaticRadialGradient } from "@paper-design/shaders-react";

interface HomeIntroProps extends ComponentPropsWithoutRef<"section"> {
  heroImageUrl?: string;
}

const containerVariants = staggerContainer(0.2, false);
const itemVariants = fadeInForward();

export function Hero({ heroImageUrl, className, ...props }: HomeIntroProps) {
  return (
    <section {...props} className={cn("relative flex flex-col", className)}>
      <StaticRadialGradient
        className="absolute inset-0 -z-10"
        radius={2}
        falloff={0.5}
        offsetY={0.6}
        colors={["#63a3ec"]}
        colorBack={"#00000000"}
        grainMixer={0.2}
      />
      {/* Text content */}
      <motion.div
        className="flex shrink-0 flex-col items-center px-8 pt-12 md:px-16 md:pt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.p variants={itemVariants} className="label mb-6 text-blue-500">
          501(c)(3) nonprofit · est. 2014
        </motion.p>

        <h1 className="flex flex-col items-center">
          <motion.span
            variants={itemVariants}
            className="text-inverse max-w-[820px] text-center font-serif text-[40px] leading-[46px] font-light tracking-[-0.02em] sm:text-[52px] sm:leading-[60px] lg:text-[64px] lg:leading-[72px] xl:text-[76px] xl:leading-[84px]"
          >
            Code &amp; community
          </motion.span>
          <motion.span
            variants={itemVariants}
            className="max-w-[820px] text-center font-serif text-[40px] leading-[46px] font-light tracking-[-0.02em] text-blue-500 italic sm:text-[52px] sm:leading-[60px] lg:text-[64px] lg:leading-[72px] xl:text-[76px] xl:leading-[84px]"
          >
            for the common good
          </motion.span>
        </h1>

        <motion.p
          variants={itemVariants}
          className="text-gray-3 mt-6 max-w-[560px] text-center font-sans text-lg leading-7"
        >
          Student teams building free software for nonprofits. Connecting
          technical skills with community need.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-9 flex w-full flex-col gap-3 px-4 sm:w-auto sm:flex-row sm:px-0"
        >
          <Link href="/get-involved/nonprofits" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">Partner with us</Button>
          </Link>
          <Link href="/get-involved/students" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Start a chapter
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Fixed gap between buttons and image */}
      <div className="h-8 shrink-0" />

      {heroImageUrl && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.8, delay: 0.6 } }}
        >
          <Image
            width={1505}
            height={543}
            className="block h-auto w-full [filter:drop-shadow(10px_-2px_4px_rgba(36,126,228,0.15))]"
            src={heroImageUrl}
            alt="A group photo of Hack4Impact students"
            priority
            sizes="100vw"
          />
        </motion.div>
      )}
    </section>
  );
}
