"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Collapsible } from "@base-ui/react/collapsible";
import { dropdowns, mobileItems } from "./nav-data";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden md:hidden"
        >
          <div className="divide-separator divide-y px-8 pb-8">
            {mobileItems.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.06 + i * 0.06,
                  duration: 0.22,
                  ease: "easeOut",
                }}
              >
                {item.type === "link" ? (
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="block py-4 font-sans text-xl"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Collapsible.Root>
                    <Collapsible.Trigger className="group flex w-full items-center justify-between py-4 font-sans text-xl outline-none">
                      {item.label}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="transition-transform duration-200 group-data-[panel-open]:rotate-180"
                      >
                        <path
                          d="M3 4.5L6 7.5L9 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Collapsible.Trigger>

                    <Collapsible.Panel
                      render={
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: "var(--collapsible-panel-height)",
                            opacity: 1,
                          }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.24,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        />
                      }
                      className="overflow-hidden"
                    >
                      {dropdowns[item.dropdownKey].map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-inverse/60 block py-3 pl-4 font-sans text-lg outline-none"
                          onClick={onClose}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </Collapsible.Panel>
                  </Collapsible.Root>
                )}{" "}
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.06 + mobileItems.length * 0.06,
                duration: 0.22,
                ease: "easeOut",
              }}
            >
              <a
                href="https://collect.crowded.me/collection/5347b60c-26a0-45da-9c0e-4910703f3152"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full rounded-md bg-blue-500 py-3 text-center font-mono text-[13px] tracking-[0.02em] text-white transition-colors hover:bg-blue-600"
              >
                Donate
              </a>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
