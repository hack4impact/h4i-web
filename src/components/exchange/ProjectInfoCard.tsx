import Link from "next/link";
import { CauseBanner } from "@/components/exchange/CauseBanner";
import { StatusBadge } from "@/components/exchange/StatusBadge";
import { CAUSE_AREA_LABELS, formatDate } from "@/lib/sourced-projects/labels";
import type { ListingSummary } from "@/lib/sourced-projects/listings-api";

export function ProjectInfoCard({ listing }: { listing: ListingSummary }) {
  return (
    <Link
      href={`/exchange/${listing.id}`}
      className="group border-separator bg-root hover:border-gray-4 flex h-full flex-col border outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
    >
      <CauseBanner causeArea={listing.causeArea} className="h-96" />
      <div className="flex flex-1 flex-col gap-6 p-16">
        <div className="flex items-start justify-between gap-8">
          <p className="text-gray-3 flex items-center gap-8 text-sm tracking-wide uppercase">
            <span>{CAUSE_AREA_LABELS[listing.causeArea]}</span>
            <span aria-hidden className="bg-separator h-10 w-1" />
            <span>Posted {formatDate(listing.postedAt)}</span>
          </p>
          <StatusBadge status={listing.status} />
        </div>
        <h3 className="text-gray-1 text-xl leading-24 group-hover:underline">
          {listing.title}
        </h3>
        <p className="text-gray-2 text-lg">
          {listing.contact && <>{listing.contact.clientOrgName} · </>}
          {listing.sourcingChapter.name}
        </p>
      </div>
    </Link>
  );
}
