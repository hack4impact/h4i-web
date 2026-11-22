import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { EDITOR_ROLES } from "@/lib/auth/roles";
import { editorOptions } from "@/lib/projects/editor";
import { ProjectApiError } from "@/lib/projects/http";
import { readProject } from "@/lib/projects/service";
import { formValue } from "@/lib/projects/form";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await requireRole(EDITOR_ROLES);
  const { id } = await params;
  let project;
  try {
    project = await readProject(user, id, true);
  } catch (error) {
    if (error instanceof ProjectApiError && [403, 404].includes(error.status))
      notFound();
    throw error;
  }
  const options = await editorOptions(
    user,
    project.teamMembers.map((member) => member.userId)
  );
  const initial = formValue({
    ...project,
    startDate:
      project.startDate instanceof Date
        ? project.startDate.toISOString()
        : project.startDate,
    endDate:
      project.endDate instanceof Date
        ? project.endDate.toISOString()
        : project.endDate,
  });
  return (
    <ProjectForm
      key={id}
      projectId={id}
      initial={initial}
      isDraft={project.isDraft}
      {...options}
    />
  );
}
