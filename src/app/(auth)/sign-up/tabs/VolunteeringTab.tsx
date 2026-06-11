"use client";

import { useState } from "react";
import {
  SelectField,
  ComboboxField,
  type SelectOption,
} from "@/components/forms/FormFields";
import { cn } from "@/lib/utils";

const Y = new Date().getFullYear();
const JOIN_YEAR_STRINGS = Array.from({ length: Y - 2014 + 1 }, (_, i) =>
  String(Y - i)
);

interface VolunteeringTabProps {
  chapters: SelectOption[];
  employerOptions: string[];
}

export function VolunteeringTab({
  chapters,
  employerOptions,
}: VolunteeringTabProps) {
  const [volunteerType, setVolunteerType] = useState<
    "STUDENT" | "PROFESSIONAL"
  >("STUDENT");

  return (
    <>
      <input type="hidden" name="volunteerType" value={volunteerType} />

      <div className="grid grid-cols-2 gap-2">
        {(["STUDENT", "PROFESSIONAL"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setVolunteerType(type)}
            className={cn(
              "rounded-[var(--radius-6)] border px-3.5 py-2.5 font-sans text-sm transition-colors",
              volunteerType === type
                ? "border-blue-400 bg-blue-500/10 text-blue-400"
                : "border-separator text-gray-3 hover:border-gray-3"
            )}
          >
            {type === "STUDENT" ? "Student" : "Professional"}
          </button>
        ))}
      </div>

      {chapters.length > 0 && (
        <SelectField
          label="Chapter"
          name="chapterId"
          options={chapters}
          placeholder="Select your chapter…"
          searchable
          required
        />
      )}

      <ComboboxField
        label="Year you started volunteering"
        id="startYear"
        name="startYear"
        options={JOIN_YEAR_STRINGS}
        placeholder="e.g. 2018"
        required
      />

      {volunteerType === "PROFESSIONAL" && (
        <ComboboxField
          label="Employer"
          id="employer"
          name="employer"
          options={employerOptions}
          placeholder="Company or organization"
          optional
          allowNew
          persistField="employer"
        />
      )}
    </>
  );
}
