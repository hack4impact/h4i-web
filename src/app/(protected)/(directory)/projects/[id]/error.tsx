"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="space-y-16 p-32">
      <h1>Project could not be loaded</h1>
      <p>Please try again.</p>
      <Button onClick={reset}>Try again</Button>
      <p>
        <Link href="/projects" className="underline">
          Back to Project Directory
        </Link>
      </p>
    </div>
  );
}
