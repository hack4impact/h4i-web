import type { Variants } from 'motion/react'

export function staggerContainer(staggerDelay = 0.1, fade = true): Variants {
  return {
    hidden: fade ? { opacity: 0 } : {},
    visible: {
      ...(fade ? { opacity: 1 } : {}),
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  }
}

export function fadeInUp(duration = 0.5): Variants {
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration,
      },
    },
  }
}

export function fadeInForward(duration = 0.6): Variants {
  return {
    hidden: { opacity: 0, scale: 0.88 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }
}
