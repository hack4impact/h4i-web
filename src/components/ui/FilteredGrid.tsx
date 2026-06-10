"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";

const itemVariants = fadeInUp(0.4);

interface FilteredGridProps<T extends { id: string }> {
  items: T[];
  filterKey: string;
  gridClassName: string;
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
  scrollable?: boolean;
  staggerDelay?: number;
}

export function FilteredGrid<T extends { id: string }>({
  items,
  filterKey,
  gridClassName,
  emptyMessage,
  renderItem,
  scrollable = false,
  staggerDelay = 0.04,
}: FilteredGridProps<T>) {
  const gridVariants = useMemo(
    () => staggerContainer(staggerDelay),
    [staggerDelay]
  );

  const grid = (
    <div className={gridClassName}>
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          {renderItem(item)}
        </motion.div>
      ))}
    </div>
  );

  const emptyState = items.length === 0 && (
    <p className="mt-16 text-center font-sans text-base text-gray-400">
      {emptyMessage}
    </p>
  );

  return (
    <motion.div
      key={filterKey}
      variants={gridVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.05 }}
    >
      {scrollable ? (
        <div className="mt-6 max-h-[72vh] overflow-y-auto pr-1">
          {grid}
          {emptyState}
        </div>
      ) : (
        <>
          {grid}
          {emptyState}
        </>
      )}
    </motion.div>
  );
}
