import type { Volunteer } from "@/lib/types/volunteer";

interface VolunteerCardProps {
  volunteer: Volunteer;
}

export function VolunteerCard({ volunteer }: VolunteerCardProps) {
  const meta = [
    volunteer.chapter,
    volunteer.gradYear ? `'${String(volunteer.gradYear).slice(2)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group border-separator bg-panel hover:border-gray-4 flex h-full flex-col overflow-hidden rounded-xl border p-3.5 transition-colors">
      {meta && (
        <p className="text-gray-3 mb-1.5 font-mono text-[9px] tracking-[0.08em] uppercase">
          {meta}
        </p>
      )}
      <p className="text-inverse flex-1 font-sans text-sm leading-snug font-medium">
        {volunteer.name}
      </p>
      {volunteer.roles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {volunteer.roles.map((role) => (
            <span
              key={role}
              className="bg-gray-5 text-gray-3 rounded-[3px] px-1.5 py-0.5 font-mono text-[9px] tracking-[0.06em] uppercase"
            >
              {role}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
