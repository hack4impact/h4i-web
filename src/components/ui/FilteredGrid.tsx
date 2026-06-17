'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'motion/react'

import { fadeInUp, staggerContainer } from '@/lib/animations'

const itemVariants = fadeInUp(0.4)

function getColCount(width: number): number {
  if (width >= 1024) return 4
  if (width >= 640) return 3
  if (width >= 480) return 2
  return 1
}

interface FilteredGridProps<T extends { id: string }> {
  items: T[]
  filterKey: string
  gridClassName: string
  emptyMessage: string
  renderItem: (item: T) => React.ReactNode
  scrollable?: boolean
  staggerDelay?: number
  estimatedItemHeight?: number
}

export function FilteredGrid<T extends { id: string }>({
  items,
  filterKey,
  gridClassName,
  emptyMessage,
  renderItem,
  scrollable = false,
  staggerDelay = 0.04,
  estimatedItemHeight = 124,
}: FilteredGridProps<T>) {
  const gridVariants = useMemo(
    () => staggerContainer(staggerDelay),
    [staggerDelay],
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(4)

  useEffect(() => {
    if (!scrollable) return
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setCols(getColCount(entries[0].contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [scrollable])

  const rows = useMemo(() => {
    if (!scrollable) return []
    const result: T[][] = []
    for (let i = 0; i < items.length; i += cols) {
      result.push(items.slice(i, i + cols))
    }
    return result
  }, [items, cols, scrollable])

  const virtualizer = useVirtualizer({
    count: scrollable ? rows.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedItemHeight + 12,
    overscan: 4,
    measureElement:
      typeof window !== 'undefined'
        ? (el) => el.getBoundingClientRect().height
        : undefined,
  })

  if (scrollable) {
    if (items.length === 0) {
      return (
        <p className='mt-16 text-center font-sans text-base text-gray-400'>
          {emptyMessage}
        </p>
      )
    }
    return (
      <div ref={scrollRef} className='mt-6 min-h-0 flex-1 overflow-y-auto pr-1'>
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <motion.div
              key={`${filterKey}-${virtualRow.key}`}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: virtualRow.start,
                left: 0,
                right: 0,
              }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: staggerDelay,
                    delayChildren: Math.min(
                      virtualRow.index * cols * staggerDelay,
                      0.3,
                    ),
                  },
                },
              }}
              initial='hidden'
              animate='visible'
              className='pb-3'
            >
              <div
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
                className='grid gap-3'
              >
                {rows[virtualRow.index].map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    {renderItem(item)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      key={filterKey}
      variants={gridVariants}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.05 }}
    >
      {items.length === 0 ? (
        <p className='mt-16 text-center font-sans text-base text-gray-400'>
          {emptyMessage}
        </p>
      ) : (
        <div className={gridClassName}>
          {items.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              {renderItem(item)}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
