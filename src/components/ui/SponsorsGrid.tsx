import type { Sponsor } from "@/lib/types/contentful";

export interface SponsorGroup {
  tier: string;
  sponsors: Sponsor[];
}

interface SponsorsGridProps {
  heading?: string;
  groups: SponsorGroup[];
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const content = sponsor.logoUrl ? (
    <img
      src={sponsor.logoUrl}
      alt={sponsor.name}
      className="logo-invert-dark h-10 w-auto max-w-full object-contain"
    />
  ) : (
    <span className="text-gray-2 group-hover:text-inverse text-center font-sans text-sm leading-tight transition-colors">
      {sponsor.name}
    </span>
  );

  const baseClass =
    "flex min-h-[80px] w-full items-center justify-center rounded-xl border border-separator bg-root p-4";

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClass} group hover:border-gray-4 transition-colors`}
      >
        {content}
      </a>
    );
  }

  return <div className={baseClass}>{content}</div>;
}

export function SponsorsGrid({ heading, groups }: SponsorsGridProps) {
  if (groups.length === 0) return null;

  return (
    <>
      {heading && (
        <h2 className="text-inverse mb-8 font-serif text-[40px] leading-[48px] font-light tracking-[-0.01em]">
          {heading}
        </h2>
      )}
      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.tier}>
            <div className="border-separator mb-4 border-b pb-2">
              <span className="label-xs text-gray-4">{group.tier}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {group.sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
