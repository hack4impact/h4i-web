import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-16 p-32">
      <h1>Project not found</h1>
      <p>This project is unavailable or you don’t have access to it.</p>
      <Link href="/projects" className="underline">
        Back to Project Directory
      </Link>
    </div>
  );
}
