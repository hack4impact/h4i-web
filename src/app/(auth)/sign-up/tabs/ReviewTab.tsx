import { type SelectOption } from "@/components/ui/Select";

interface ReviewTabProps {
  data: Record<string, string>;
  chapterOptions: SelectOption[];
}

interface Section {
  title: string;
  rows: [string, string][];
}

export function ReviewTab({ data, chapterOptions }: ReviewTabProps) {
  function get(key: string): string | null {
    const v = data[key];
    return v && v.trim() ? v.trim() : null;
  }

  const chapterLabel =
    chapterOptions.find((c) => c.value === get("chapterId"))?.label ??
    get("chapterId");

  const sections: Section[] = [
    {
      title: "Account",
      rows: [
        ["Name", `${get("firstName") ?? ""} ${get("lastName") ?? ""}`.trim()],
        ["Email", get("email") ?? ""],
        ["Password", "••••••••"],
      ].filter(([, v]) => v) as [string, string][],
    },
    {
      title: "Volunteering",
      rows: [
        [
          "Type",
          get("volunteerType") === "PROFESSIONAL" ? "Professional" : "Student",
        ],
        chapterLabel ? (["Chapter", chapterLabel] as [string, string]) : null,
        get("startYear")
          ? (["Started", get("startYear")!] as [string, string])
          : null,
        get("employer")
          ? (["Employer", get("employer")!] as [string, string])
          : null,
      ].filter(Boolean) as [string, string][],
    },
    {
      title: "Education",
      rows: [
        get("university")
          ? (["University", get("university")!] as [string, string])
          : null,
        get("degreeType")
          ? (["Degree", get("degreeType")!] as [string, string])
          : null,
        get("graduationYear")
          ? (["Graduation", get("graduationYear")!] as [string, string])
          : null,
        get("major") ? (["Major", get("major")!] as [string, string]) : null,
      ].filter(Boolean) as [string, string][],
    },
    {
      title: "Background",
      rows: [
        get("birthYear")
          ? (["Birth year", get("birthYear")!] as [string, string])
          : null,
        get("gender") ? (["Gender", get("gender")!] as [string, string]) : null,
        get("raceEthnicity")
          ? (["Race & ethnicity", get("raceEthnicity")!] as [string, string])
          : null,
      ].filter(Boolean) as [string, string][],
    },
  ].filter((s) => s.rows.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="label-xs text-gray-4 mb-1.5">{section.title}</p>
          <div className="border-separator overflow-hidden rounded-[var(--radius-6)] border">
            {section.rows.map(([label, value], i) => (
              <div
                key={label}
                className={
                  "flex items-center justify-between px-3.5 py-2.5" +
                  (i > 0 ? " border-separator border-t" : "")
                }
              >
                <span className="label-xs text-gray-3 shrink-0">{label}</span>
                <span className="label-xs text-gray-2 ml-4 truncate text-right">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
