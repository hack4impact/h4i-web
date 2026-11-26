"use client";

import Link from "next/link";

export default function ProjectsError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="space-y-16 p-24">
      <h1>Projects could not be loaded</h1>
      <p>
        Please try again. If the problem continues, contact an administrator.
      </p>
      <div className="flex flex-wrap gap-12">
        <button className="btn min-h-44" onClick={retry}>
          Try again
        </button>
        <Link className="btn min-h-44" href="/projects">
          Back to projects
        </Link>
      </div>
    </div>
  );
}
