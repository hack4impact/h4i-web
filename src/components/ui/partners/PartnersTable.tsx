"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FilterBar } from "../FilterBar";
import { PartnerCard } from "./PartnerCard";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type { Partner } from "@/lib/types/partner";

const gridVariants = staggerContainer(0.03);
const itemVariants = fadeInUp(0.4);

type Sort = "name-asc" | "name-desc" | "projects-desc";

const SORT_OPTIONS = [
  { value: "name-asc", label: "A–Z" },
  { value: "name-desc", label: "Z–A" },
  { value: "projects-desc", label: "Most projects" },
];

interface PartnersTableProps {
  partners: Partner[];
}

export function PartnersTable({ partners }: PartnersTableProps) {
  const [focusArea, setFocusArea] = useState("all");
  const [orgType, setOrgType] = useState("all");
  const [sort, setSort] = useState<Sort>("name-asc");

  const focusAreaOptions = useMemo(() => {
    const subjects = new Set<string>();
    let hasNone = false;
    for (const p of partners) {
      if (p.subjects?.length) for (const s of p.subjects) subjects.add(s);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(subjects)
        .sort()
        .map((s) => ({ value: s, label: s })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [partners]);

  const orgTypeOptions = useMemo(() => {
    const types = new Set<string>();
    let hasNone = false;
    for (const p of partners) {
      if (p.organizationTypes?.length)
        for (const t of p.organizationTypes) types.add(t);
      else hasNone = true;
    }
    return [
      { value: "all", label: "All" },
      ...Array.from(types)
        .sort()
        .map((t) => ({ value: t, label: t })),
      ...(hasNone ? [{ value: "__none__", label: "None" }] : []),
    ];
  }, [partners]);

  const filtered = useMemo(() => {
    let list = [...partners];
    if (focusArea === "__none__")
      list = list.filter((p) => !p.subjects?.length);
    else if (focusArea !== "all")
      list = list.filter((p) => p.subjects?.includes(focusArea));
    if (orgType === "__none__")
      list = list.filter((p) => !p.organizationTypes?.length);
    else if (orgType !== "all")
      list = list.filter((p) => p.organizationTypes?.includes(orgType));

    list.sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      const bCount = b.projectCount ?? -1;
      const aCount = a.projectCount ?? -1;
      return bCount !== aCount ? bCount - aCount : a.name.localeCompare(b.name);
    });

    return list;
  }, [partners, focusArea, orgType, sort]);

  return (
    <div>
      <FilterBar
        filters={[
          {
            label: "Focus Area",
            value: focusArea,
            onValueChange: setFocusArea,
            options: focusAreaOptions,
          },
          {
            label: "Org Type",
            value: orgType,
            onValueChange: setOrgType,
            options: orgTypeOptions,
          },
        ]}
        sort={{
          label: "Sort",
          value: sort,
          onValueChange: (v) => setSort(v as Sort),
          options: SORT_OPTIONS,
        }}
      />

      <motion.div
        key={`${focusArea}|${orgType}|${sort}`}
        variants={gridVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        <div className="mt-6 max-h-[72vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {filtered.map((partner) => (
              <motion.div key={partner.id} variants={itemVariants}>
                <PartnerCard partner={partner} />
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-16 text-center font-sans text-base text-gray-400">
              No partners match the selected filters.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
