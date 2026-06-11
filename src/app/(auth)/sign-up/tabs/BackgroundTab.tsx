import {
  ComboboxField,
  SelectField,
  type SelectOption,
} from "@/components/forms/FormFields";

const Y = new Date().getFullYear();
const BIRTH_YEAR_STRINGS = Array.from({ length: Y - 14 - 1940 + 1 }, (_, i) =>
  String(Y - 14 - i)
);

interface BackgroundTabProps {
  genderOptions: SelectOption[];
  raceOptions: SelectOption[];
}

export function BackgroundTab({
  genderOptions,
  raceOptions,
}: BackgroundTabProps) {
  return (
    <>
      <div className="border-separator/50 bg-panel/40 rounded-xl border px-4 py-3.5">
        <p className="text-gray-3 font-sans text-[12px] leading-relaxed">
          Collected voluntarily to help us understand and improve diversity
          across our volunteer community. Never shared with third parties or
          used to evaluate participation.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ComboboxField
          label="Birth year"
          name="birthYear"
          options={BIRTH_YEAR_STRINGS}
          placeholder="e.g. 1998"
          optional
        />
        <SelectField
          label="Gender"
          name="gender"
          options={genderOptions}
          placeholder="Select…"
          optional
        />
      </div>

      <SelectField
        label="Race & ethnicity"
        name="raceEthnicity"
        options={raceOptions}
        placeholder="Select…"
        searchable
        optional
      />
    </>
  );
}
