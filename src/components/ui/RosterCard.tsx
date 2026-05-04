"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

export type RosterEntry = {
  name: string;
  role: string;
  term: string;
  image?: string;
  href?: string;
};

type RosterCardProps = {
  entries: RosterEntry[];
  heading?: string;
  terms?: string[];
  currentTerm?: string;
  className?: string;
};

export function RosterCard({
  entries,
  heading = "Team",
  terms: termsProp,
  currentTerm,
  className,
}: RosterCardProps) {
  const terms = useMemo(() => {
    if (termsProp?.length) return termsProp;
    const seen = new Set<string>();
    for (const e of entries) if (e.term) seen.add(e.term);
    return Array.from(seen);
  }, [termsProp, entries]);

  const [selected, setSelected] = useState<string>(terms[0] ?? "");
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () => entries.filter((e) => e.term === selected),
    [entries, selected]
  );

  const isCurrent = selected === (currentTerm ?? terms[0]);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div
      className={cn(
        "border-separator bg-panel rounded-4 overflow-hidden border",
        className
      )}
    >
      {/* Header */}
      <div className="bg-panel-header border-separator flex items-center justify-between border-b px-12 py-6">
        <span className="font-medium">{heading}</span>

        <SelectRoot
          value={selected}
          onValueChange={(v) => v && setSelected(v)}
          open={open}
          onOpenChange={setOpen}
          modal={false}
        >
          <SelectTrigger
            className="btn btn-ghost flex items-center gap-6"
            aria-label="Select term"
          >
            <SelectValue />
            {isCurrent && (
              <span className="text-gray-2 font-normal">Current</span>
            )}
            <Chevron size={13} strokeWidth={1.5} className="text-gray-3" />
          </SelectTrigger>
          <SelectContent>
            {terms.map((term) => (
              <SelectItem key={term} value={term}>
                <span>{term}</span>
                {term === (currentTerm ?? terms[0]) && (
                  <span className="text-gray-3 ml-6 font-normal">Current</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
      </div>

      {/* Rows */}
      {visible.length === 0 ? (
        <div className="text-gray-3 px-12 py-16">No members for this term.</div>
      ) : (
        <ul>
          {visible.map((entry, i) => (
            <li
              key={`${entry.name}-${i}`}
              className="border-separator flex items-center gap-10 border-b px-12 py-8 last:border-0"
            >
              <Avatar name={entry.name} image={entry.image} size="sm" />
              <div className="flex flex-1 items-center justify-between gap-8">
                {entry.href ? (
                  <a href={entry.href} className="hover:underline">
                    {entry.name}
                  </a>
                ) : (
                  <span>{entry.name}</span>
                )}
                <span className="text-gray-2 shrink-0">{entry.role}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
