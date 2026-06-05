"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectCaption,
} from "@/components/ui/Select";
import {
  ComboboxRoot,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/Combobox";

const TERMS = ["Sp '25", "Fa '24", "Sp '24", "Fa '23"];

const CHAPTERS = [
  "Boston University",
  "Brown University",
  "Carnegie Mellon",
  "Columbia University",
  "Cornell University",
  "Georgia Tech",
  "Harvard University",
  "MIT",
  "NYU",
  "Princeton University",
  "Stanford University",
  "UC Berkeley",
  "UCLA",
  "UPenn",
  "Yale University",
];

export function SelectDemo() {
  const [term, setTerm] = useState<string>(TERMS[0]);
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-gray-2">Select — small fixed list</p>
      <SelectRoot
        value={term}
        onValueChange={(v) => v && setTerm(v)}
        open={open}
        onOpenChange={setOpen}
        modal={false}
      >
        <SelectTrigger className="btn btn-ghost flex w-fit items-center gap-6">
          <SelectValue />
          <Chevron size={13} strokeWidth={1.5} className="text-gray-3" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectCaption>Term</SelectCaption>
          {TERMS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value="all">All terms</SelectItem>
        </SelectContent>
      </SelectRoot>
      <p className="text-gray-2">Selected: {term}</p>
    </div>
  );
}

export function ComboboxDemo() {
  const [chapter, setChapter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className="flex flex-col gap-8">
      <p className="text-gray-2">Combobox — large searchable list</p>
      <ComboboxRoot
        items={CHAPTERS}
        value={chapter}
        onValueChange={(v) => setChapter(v)}
        open={open}
        onOpenChange={setOpen}
        modal={false}
      >
        <ComboboxInputGroup className="w-[240px]">
          <ComboboxInput placeholder="Search chapters..." />
          <ComboboxTrigger>
            <Chevron size={13} strokeWidth={1.5} />
          </ComboboxTrigger>
        </ComboboxInputGroup>
        <ComboboxContent>
          <ComboboxList>
            {(item: unknown) => (
              <ComboboxItem key={item as string} value={item as string}>
                {item as string}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty />
        </ComboboxContent>
      </ComboboxRoot>
      <p className="text-gray-2">
        {chapter ? `Selected: ${chapter}` : "None selected"}
      </p>
    </div>
  );
}
