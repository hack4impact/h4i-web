import {
  ComboboxField,
  SelectField,
  type SelectOption,
} from "@/components/forms/FormFields";

const Y = new Date().getFullYear();
const GRAD_YEAR_STRINGS = Array.from({ length: Y + 8 - 1960 + 1 }, (_, i) =>
  String(Y + 8 - i)
);

const DEGREE_OPTIONS: SelectOption[] = [
  { value: "Associate's", label: "Associate's" },
  { value: "Bachelor's", label: "Bachelor's" },
  { value: "Master's", label: "Master's" },
  { value: "PhD / Doctorate", label: "PhD / Doctorate" },
  { value: "Certificate", label: "Certificate" },
  { value: "Other", label: "Other" },
];

interface EducationTabProps {
  universityOptions: string[];
  majorOptions: string[];
}

export function EducationTab({
  universityOptions,
  majorOptions,
}: EducationTabProps) {
  return (
    <>
      <ComboboxField
        label="University"
        id="university"
        name="university"
        options={universityOptions}
        placeholder="e.g. Carnegie Mellon University"
        optional
        allowNew
      />

      <SelectField
        label="Degree type"
        name="degreeType"
        options={DEGREE_OPTIONS}
        placeholder="Select…"
        optional
      />

      <div className="grid grid-cols-2 gap-3">
        <ComboboxField
          label="Graduation year"
          id="graduationYear"
          name="graduationYear"
          options={GRAD_YEAR_STRINGS}
          placeholder="e.g. 2026"
          optional
        />
        <ComboboxField
          label="Major"
          id="major"
          name="major"
          options={majorOptions}
          placeholder="e.g. Computer Science"
          optional
          allowNew
          persistField="major"
        />
      </div>
    </>
  );
}
