export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading project detail"
      className="space-y-24 p-32"
    >
      <p>Loading project…</p>
      <div className="bg-panel h-48 w-2/3 motion-safe:animate-pulse" />
      <div className="bg-panel h-120 motion-safe:animate-pulse" />
      <div className="bg-panel h-240 motion-safe:animate-pulse" />
    </div>
  );
}
