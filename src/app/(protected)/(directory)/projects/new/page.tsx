import { requireRole } from "@/lib/auth/guards";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import { editorOptions } from "@/lib/projects/editor";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default async function NewProjectPage() {
  const { user } = await requireRole(EDITOR_ROLES);
  return <ProjectForm {...await editorOptions(user)} />;
}
