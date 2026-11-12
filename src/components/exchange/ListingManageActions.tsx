"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { browserRequest, GraphQLRequestError } from "@/lib/graphql/request";
import { createListingsApi } from "@/lib/sourced-projects/listings-api";

const listingsApi = createListingsApi(browserRequest);

// Edit and withdraw controls, shown to the sourcing chapter's leaders and
// admins. Withdrawing asks for confirmation inline before it runs.
export function ListingManageActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function withdraw() {
    setError(null);
    startTransition(async () => {
      try {
        await listingsApi.withdrawListing(listingId);
        router.push("/exchange");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof GraphQLRequestError
            ? err.message
            : "Couldn't withdraw the listing. Try again."
        );
        setConfirming(false);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-8">
      {confirming ? (
        <div
          role="group"
          aria-label="Confirm withdrawal"
          className="flex flex-wrap items-center justify-end gap-8"
        >
          <span className="text-gray-2">
            Withdraw this listing? It will be hidden from every chapter.
          </span>
          <Button
            variant="high-contrast"
            onClick={withdraw}
            disabled={pending}
            autoFocus
          >
            {pending ? "Withdrawing…" : "Withdraw"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-8">
          <Link href={`/exchange/${listingId}/edit`} className="btn">
            <Pencil size={11} strokeWidth={1.75} />
            Edit
          </Link>
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            Withdraw
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red max-w-[360px] text-right">
          {error}
        </p>
      )}
    </div>
  );
}
