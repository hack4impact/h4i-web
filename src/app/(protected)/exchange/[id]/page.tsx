import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { CauseBanner } from "@/components/exchange/CauseBanner";
import { StatusBadge } from "@/components/exchange/StatusBadge";
import { Card } from "@/components/ui/Card";
import { CAUSE_AREA_LABELS, formatDate } from "@/lib/sourced-projects/labels";
import { listingsApi } from "@/lib/sourced-projects/listings-server";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-8">
      <h2 className="text-gray-1 text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Prose({ children }: { children: string }) {
  return (
    <p className="text-gray-2 max-w-[68ch] text-lg leading-20 whitespace-pre-line">
      {children}
    </p>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <dt className="text-gray-3">{label}</dt>
      <dd className="text-gray-1 text-lg">{children}</dd>
    </div>
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await listingsApi.listing(id);
  if (!listing) notFound();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1120px] px-32 pt-32 pb-48">
        <Link
          href="/exchange"
          className="text-gray-2 hover:text-gray-1 inline-flex items-center gap-4 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back to projects
        </Link>

        <CauseBanner causeArea={listing.causeArea} className="mt-16 h-160" />

        <div className="grid gap-32 pt-24 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="min-w-0">
            <header className="flex items-start justify-between gap-16">
              <div>
                <h1>{listing.title}</h1>
                <p className="text-gray-2 mt-4 flex flex-wrap items-center gap-x-8 text-lg">
                  <span>Posted by {listing.sourcingChapter.name}</span>
                  <span aria-hidden>•</span>
                  <span className="inline-flex items-center gap-4">
                    Verified {formatDate(listing.lastVerifiedAt)}
                    <Check size={12} strokeWidth={2} />
                  </span>
                </p>
              </div>
              <StatusBadge status={listing.status} />
            </header>

            <hr className="my-24" />

            <div className="space-y-32">
              <Section title="Project overview">
                <Prose>{listing.description}</Prose>
              </Section>
              <Section title="Scope">
                <Prose>{listing.scope}</Prose>
              </Section>
              <Section title="Handoff notes">
                <Prose>{listing.handoffNotes}</Prose>
              </Section>
              {listing.links.length > 0 && (
                <Section title="Links">
                  <ul className="space-y-6">
                    {listing.links.map((link) => (
                      <li key={link.id}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-2 inline-flex items-center gap-4 text-lg hover:underline"
                        >
                          {link.label}
                          <ExternalLink size={12} strokeWidth={1.5} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>
          </article>

          <aside>
            <Card className="bg-root p-20">
              <h2 className="text-gray-1 text-xl">At a glance</h2>
              <dl className="mt-16 space-y-16">
                <Fact label="Status">
                  <StatusBadge status={listing.status} />
                </Fact>
                <Fact label="Cause area">
                  {CAUSE_AREA_LABELS[listing.causeArea]}
                </Fact>
                <Fact label="Sourcing chapter">
                  {listing.sourcingChapter.name}
                </Fact>
                {listing.contact && (
                  <Fact label="Nonprofit">{listing.contact.clientOrgName}</Fact>
                )}
                {listing.techContext && (
                  <Fact label="Tech context">{listing.techContext}</Fact>
                )}
                <Fact label="Posted">{formatDate(listing.postedAt)}</Fact>
              </dl>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
