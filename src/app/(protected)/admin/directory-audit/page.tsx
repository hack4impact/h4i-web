import { PageHeader } from "@/components/ui/PageHeader";
import { requireRole } from "@/lib/auth/guards";
import { DIRECTORY_ADMIN_ROLES } from "@/lib/auth/roles";
import { adminListRecentAuditLogs } from "@/actions/directory-admin";

/**
 * Minimal admin-only audit view for local/manual verification.
 * COD and NATIONALS (DIRECTORY_ADMIN_ROLES). Not a designed product surface.
 */
export default async function DirectoryAuditPage() {
  await requireRole(DIRECTORY_ADMIN_ROLES);
  const rows = await adminListRecentAuditLogs(50);

  return (
    <div className="flex h-full flex-col pt-32">
      <PageHeader
        title="Directory audit"
        subtitle="Recent Member/Alumni moderation and role-change events."
      />
      <div className="min-h-0 flex-1 overflow-auto p-32 pt-0">
        {rows.length === 0 ? (
          <p className="text-gray-3 text-lg">No audit entries yet.</p>
        ) : (
          <table className="w-full border-collapse text-left text-lg">
            <thead className="text-gray-3">
              <tr>
                <th className="border-separator border-b px-8 py-6 font-medium">
                  When
                </th>
                <th className="border-separator border-b px-8 py-6 font-medium">
                  Actor
                </th>
                <th className="border-separator border-b px-8 py-6 font-medium">
                  Action
                </th>
                <th className="border-separator border-b px-8 py-6 font-medium">
                  Target
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border-separator border-b px-8 py-8 tabular-nums">
                    {row.createdAt.toISOString()}
                  </td>
                  <td className="border-separator border-b px-8 py-8">
                    {row.actor.email} ({row.actor.role})
                  </td>
                  <td className="border-separator border-b px-8 py-8">
                    {row.action}
                  </td>
                  <td className="border-separator border-b px-8 py-8">
                    {row.targetKind}:{row.targetId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
