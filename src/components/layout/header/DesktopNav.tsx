"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, LayoutGroup } from "motion/react";
import { Menu } from "@base-ui/react/menu";
import { dropdowns, dropdownKeys, type DropdownKey } from "./nav-data";

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

export function DesktopNav() {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [hoveredDropdownItem, setHoveredDropdownItem] = useState<string | null>(
    null
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setOpenDropdown(null);
      setHoveredNav(null);
      setHoveredDropdownItem(null);
    }, 120);
  };

  const closeAll = () => {
    cancelClose();
    setOpenDropdown(null);
    setHoveredNav(null);
    setHoveredDropdownItem(null);
  };

  return (
    <div className="hidden items-center gap-6 md:flex">
      <LayoutGroup>
        <div className="flex items-center" onMouseLeave={scheduleClose}>
          {/* About */}
          <Link
            href="/about"
            onClick={closeAll}
            className="text-inverse relative inline-flex items-center rounded-md px-3 py-1.5 font-sans text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            onMouseEnter={() => {
              cancelClose();
              setHoveredNav("about");
            }}
          >
            {hoveredNav === "about" && (
              <motion.div
                layoutId="nav-highlight"
                className="bg-gray-5 pointer-events-none absolute inset-0 rounded-md"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">About</span>
          </Link>

          {/* Dropdown triggers */}
          {dropdownKeys.map((key) => (
            <Menu.Root
              key={key}
              open={openDropdown === key}
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  cancelClose();
                  setOpenDropdown(key);
                } else {
                  setOpenDropdown((prev) => (prev === key ? null : prev));
                }
              }}
            >
              <Menu.Trigger
                className="text-inverse relative inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 font-sans text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                onMouseEnter={() => {
                  cancelClose();
                  setHoveredNav(key);
                  setOpenDropdown(key);
                }}
              >
                {hoveredNav === key && (
                  <motion.div
                    layoutId="nav-highlight"
                    className="bg-gray-5 pointer-events-none absolute inset-0 rounded-md"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {key}
                  <ChevronIcon isOpen={openDropdown === key} />
                </span>
              </Menu.Trigger>

              <Menu.Portal>
                <Menu.Positioner
                  sideOffset={6}
                  align="start"
                  onMouseEnter={() => {
                    cancelClose();
                    setHoveredNav(key);
                  }}
                  onMouseLeave={scheduleClose}
                >
                  <Menu.Popup
                    className="border-separator bg-root shadow-popup z-50 min-w-[160px] overflow-hidden rounded-lg border outline-none"
                    render={
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{
                          duration: 0.18,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    }
                  >
                    <div
                      className="py-1.5"
                      onMouseLeave={() => setHoveredDropdownItem(null)}
                    >
                      {dropdowns[key].map((item) => (
                        <Menu.LinkItem
                          key={item.href}
                          render={<Link href={item.href} />}
                          closeOnClick
                          onClick={closeAll}
                          onMouseEnter={() => setHoveredDropdownItem(item.href)}
                          onFocus={() => setHoveredDropdownItem(item.href)}
                          onBlur={() => setHoveredDropdownItem(null)}
                          className="text-inverse relative block px-4 py-2 font-sans text-[15px] whitespace-nowrap outline-none"
                        >
                          {hoveredDropdownItem === item.href && (
                            <motion.div
                              layoutId={`dropdown-hl-${key}`}
                              className="bg-gray-5 pointer-events-none absolute inset-x-1.5 inset-y-0 rounded"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 32,
                              }}
                            />
                          )}
                          <span className="relative z-10">{item.label}</span>
                        </Menu.LinkItem>
                      ))}
                    </div>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          ))}
        </div>
      </LayoutGroup>

      <a
        href="https://collect.crowded.me/collection/5347b60c-26a0-45da-9c0e-4910703f3152"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-md bg-blue-500 px-5 py-2 font-mono text-[13px] tracking-[0.02em] text-white transition-colors hover:bg-blue-600"
      >
        Donate
      </a>
    </div>
  );
}
