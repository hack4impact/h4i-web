"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";
import type { FAQ } from "@/lib/types/contentful";
import { TEXT_CLASS } from "@/lib/constants";

interface AccordionListProps {
  label?: string;
  items: FAQ[];
  color?: string;
}

export function AccordionList({
  label = "Common Questions",
  items,
  color = "blue",
}: AccordionListProps) {
  return (
    <section className="page-section">
      <div className="section-inner">
        <p className={cn("label mb-12", TEXT_CLASS[color])}>{label}</p>
        {items.map((faq, i) => (
          <Collapsible.Root key={faq.question}>
            <div className="border-separator border-t">
              <Collapsible.Trigger className="group flex w-full cursor-pointer items-start gap-8 py-7 text-left">
                <span
                  className={cn(
                    "w-7 shrink-0 font-mono text-[11px] leading-[27px] tracking-[0.05em]",
                    TEXT_CLASS[color]
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-inverse flex-1 font-serif text-[19px] leading-[27px]">
                  {faq.question}
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[20px] leading-[27px] transition-transform duration-200 group-data-[panel-open]:rotate-45",
                    TEXT_CLASS[color]
                  )}
                >
                  +
                </span>
              </Collapsible.Trigger>
              <Collapsible.Panel className="[height:var(--collapsible-panel-height,0px)] overflow-hidden [transition:height_200ms_ease]">
                <p className="text-gray-3 pb-7 pl-[60px] font-sans text-[14px] leading-[22px]">
                  {faq.answer}
                </p>
              </Collapsible.Panel>
            </div>
          </Collapsible.Root>
        ))}
      </div>
    </section>
  );
}
