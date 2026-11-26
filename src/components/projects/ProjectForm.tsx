"use client";

import { useState, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { DeleteProject } from "./DeleteProject";
import { useRouter } from "next/navigation";
import { useProjectDraft } from "./useProjectDraft";
import { MemberPicker, PartnerPicker } from "./ReferencePickers";
import type { MemberReference } from "@/lib/projects/references";
import { Button } from "@/components/ui/Button";
import {
  draftErrors,
  draftFieldPath,
  errorSection,
  formValue,
  type ProjectFormValue,
} from "@/lib/projects/form";
import { projectClient, ProjectRequestError } from "@/lib/projects/client";
import {
  requiredByStage,
  stages,
  type ProjectPatch,
} from "@/lib/projects/validation";

const control =
  "border-separator bg-control focus-visible:outline-focus w-full rounded-4 border px-12 py-8 focus-visible:outline-2 disabled:opacity-60";
const stageLabels = {
  design: "Design",
  development: "Development",
  launched: "Launched",
  maintenance: "Maintenance",
};
const labels: Record<string, string> = {
  name: "Project name",
  chapterId: "Chapter",
  tagline: "Tagline",
  nonprofitPartner: "Nonprofit partner",
  nonprofitPartnerName: "Nonprofit partner",
  startDate: "Start date",
  endDate: "End date",
  problemStatement: "Problem statement",
  goalStatement: "Project goal",
  teamMembers: "Team members",
  solutionDescription: "Solution",
  resourceLinks: "Resource links",
  demoMedia: "Demo media",
};
function fieldLabel(field: string) {
  const parts = field.split(".");
  if (parts[0] === "teamMembers" && /^\d+$/.test(parts[1] || ""))
    return parts[2] === "role"
      ? `Role for team member ${Number(parts[1]) + 1}`
      : `Team member ${Number(parts[1]) + 1}`;
  if (parts[0] === "resourceLinks" && /^\d+$/.test(parts[1] || ""))
    return `URL for resource link ${Number(parts[1]) + 1}`;
  return labels[field] || "Project field";
}
function fieldId(name: string) {
  return `project-${name.replaceAll(".", "-")}`;
}
function Field({
  name,
  label,
  required,
  error,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <label htmlFor={fieldId(name)} className="block">
        {label}
        {required && (
          <span className="text-red ml-4" title="Required to publish">
            *<span className="sr-only"> required to publish</span>
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${fieldId(name)}-error`} className="text-red">
          {error}
        </p>
      )}
    </div>
  );
}
function Section({
  id,
  title,
  children,
  errors = {},
}: {
  id: string;
  title: string;
  errors?: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`rounded-6 scroll-mt-16 space-y-20 border p-20 sm:p-24 ${Object.keys(errors).some((field) => errorSection(field) === Number(id.slice(-1))) ? "border-red" : "border-separator"}`}
    >
      <h2 id={`${id}-title`} className="text-xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
function Tags({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value: string[];
  onChange: (tags: string[]) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  function commit() {
    const next = [...value];
    for (const tag of text
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean))
      if (
        !next.some((existing) => existing.toLowerCase() === tag.toLowerCase())
      )
        next.push(tag.slice(0, 100));
    onChange(next.slice(0, 100));
    setText("");
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6">
        {value.map((tag) => (
          <button
            key={tag}
            type="button"
            className="border-separator bg-panel rounded-4 border px-8 py-4"
            aria-label={`Remove ${tag}`}
            disabled={disabled}
            onClick={() => onChange(value.filter((item) => item !== tag))}
          >
            {tag} ×
          </button>
        ))}
      </div>
      <input
        id={fieldId(name)}
        className={control}
        value={text}
        maxLength={100}
        placeholder="Type a tag and press Enter or comma"
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          if (text.trim()) commit();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commit();
          }
        }}
      />
    </div>
  );
}

export function ProjectForm({
  initial,
  projectId: initialId = null,
  isDraft: initialDraft = true,
  chapters,
  members,
  canDelete = false,
}: {
  initial?: ProjectPatch;
  projectId?: string | null;
  isDraft?: boolean;
  chapters: { id: string; name: string }[];
  members: MemberReference[];
  canDelete?: boolean;
}) {
  const [value, setValue] = useState(() =>
    formValue({
      chapterId: chapters.length === 1 ? chapters[0].id : "",
      ...initial,
    })
  );
  const [memberOptions, setMemberOptions] = useState(members);
  const isDraft = initialDraft;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [accessLost, setAccessLost] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const draft = useProjectDraft(
    value,
    initialId,
    busy || deleteOpen || accessLost
  );
  const projectId = draft.id;
  const locked = busy || deleteOpen || draft.blocked || accessLost;
  const required: readonly string[] = requiredByStage[value.stage];
  function update<K extends keyof ProjectFormValue>(
    name: K,
    next: ProjectFormValue[K]
  ) {
    setValue((previous) => ({ ...previous, [name]: next }));
    setErrors({});
    setMessage("");
  }
  function inputProps(name: keyof ProjectFormValue) {
    return {
      id: fieldId(name),
      className: control,
      "aria-invalid": Boolean(errors[name]),
      "aria-required": required.includes(name),
      "aria-describedby": errors[name] ? `${fieldId(name)}-error` : undefined,
    };
  }
  function report(error: unknown) {
    if (error instanceof ProjectRequestError) {
      if ([401, 403, 404].includes(error.status)) {
        setAccessLost(true);
        setMessage(
          "Your access changed or this project is no longer available. Changes were not saved. Reload to refresh your access."
        );
        return;
      }
      const missing = error.details?.missingFields;
      if (missing)
        setErrors(
          Object.fromEntries(
            missing.map((key) => {
              const field =
                key === "nonprofitPartner"
                  ? "nonprofitPartnerName"
                  : draftFieldPath(value, key);
              return [
                field,
                `${fieldLabel(field)} is required to publish at ${stageLabels[value.stage]}.`,
              ];
            })
          )
        );
      else if (error.details?.fieldErrors)
        setErrors(
          Object.fromEntries(
            Object.entries(error.details.fieldErrors).map(([key, messages]) => [
              key,
              messages.join(" "),
            ])
          )
        );
      setMessage(error.message);
    } else
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save. Please try again."
      );
  }
  async function save(publish: boolean) {
    const invalid = draftErrors(value);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setMessage("Check the fields below. Your changes have not been saved.");
      return;
    }
    draft.suspend();
    setBusy(true);
    setMessage(publish ? "Saving and publishing…" : "Saving draft…");
    try {
      const saved = await draft.save();
      if (publish) {
        await draft.publish();
        if (draft.isActive()) {
          router.push(`/projects/${encodeURIComponent(saved.id)}`);
          router.refresh();
        }
      } else setMessage("");
    } catch (error) {
      report(error);
    } finally {
      draft.resume();
      setBusy(false);
    }
  }
  async function upload(
    files: FileList | null,
    purpose: "demo" | "partner-photo" = "demo"
  ) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    if (!value.name.trim() || !value.chapterId) {
      setMessage("Enter a project name and chapter before uploading media.");
      return;
    }
    if (
      purpose === "demo" &&
      value.demoMedia.length + selectedFiles.length > 50
    ) {
      setMessage("A project may have up to 50 media files.");
      return;
    }
    draft.suspend();
    setBusy(true);
    setMessage("Uploading media…");
    const uploaded: string[] = [];
    try {
      const id = await draft.ensureId();
      for (const file of selectedFiles)
        uploaded.push((await projectClient.upload(id, file, purpose)).url);
      setMessage("");
    } catch (error) {
      report(error);
    } finally {
      if (uploaded.length)
        setValue((previous) => ({
          ...previous,
          ...(purpose === "partner-photo"
            ? { nonprofitPartnerPhoto: uploaded[0] }
            : { demoMedia: [...previous.demoMedia, ...uploaded] }),
        }));
      draft.resume();
      setBusy(false);
    }
  }
  async function leave(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    event.preventDefault();
    if (busy) return;
    if (draft.blocked || accessLost || !draft.dirty) {
      router.push("/projects");
      return;
    }
    const invalid = draftErrors(value);
    if (Object.keys(invalid).length) {
      setErrors(invalid);
      setMessage(
        "Check these fields before leaving so your changes can be saved."
      );
      return;
    }
    draft.suspend();
    setBusy(true);
    try {
      await draft.save();
      if (draft.isActive()) {
        router.push("/projects");
        router.refresh();
      }
    } catch (error) {
      report(error);
    } finally {
      draft.resume();
      setBusy(false);
    }
  }
  const sections = [
    "Basics",
    "Nonprofit & Timeline",
    "Project Goal",
    "Team Members",
    "Solution",
    "Resource Links",
  ];
  if (!chapters.length)
    return (
      <div className="space-y-16 p-32">
        <h1>Chapter assignment needed</h1>
        <p>
          A National Admin must assign you a chapter before you can add
          projects.
        </p>
        <Link
          href="/projects"
          onClick={(event) => void leave(event)}
          className="underline"
        >
          Back to projects
        </Link>
      </div>
    );
  return (
    <div className="h-full overflow-y-auto">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save(false);
        }}
        className="mx-auto max-w-1100 space-y-24 px-16 py-24 sm:px-32"
      >
        <header className="flex flex-wrap items-center justify-between gap-16">
          <div>
            <Link
              href="/projects"
              onClick={(event) => void leave(event)}
              className="text-gray-2 underline"
            >
              ← Back to projects
            </Link>
            <h1 className="mt-12">
              {projectId ? "Edit Project" : "Add Project"}
            </h1>
            <p className="text-gray-3 mt-6">
              {isDraft ? "Draft" : "Published project"} · Fields marked * are
              required to publish. Partial drafts can be saved.
            </p>
          </div>
          <div className="flex gap-8">
            {canDelete && projectId && (
              <DeleteProject
                id={projectId}
                name={value.name}
                disabled={busy || draft.blocked || accessLost}
                beforeDelete={draft.waitForSaves}
                onOpenChange={(open) => {
                  if (open) draft.suspend();
                  else draft.resume();
                  setDeleteOpen(open);
                }}
              />
            )}
            <Button type="submit" disabled={locked}>
              Save Draft
            </Button>
            <Button
              type="button"
              variant="high-contrast"
              disabled={locked}
              onClick={() => void save(true)}
            >
              Publish Changes
            </Button>
          </div>
        </header>
        <p role="status" aria-live="polite" className="text-gray-2 min-h-16">
          {message ||
            (draft.error && !draft.blocked
              ? `${draft.status}: ${draft.error.message}`
              : draft.status)}
        </p>
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="border-red rounded-6 border p-16">
            <p className="mb-8">Please review these fields:</p>
            <ul className="list-inside list-disc">
              {Object.entries(errors).map(([key, error]) => (
                <li key={key}>
                  <a
                    className="underline"
                    href={`#${fieldId(key === "nonprofitPartner" ? "nonprofitPartnerName" : key)}`}
                  >
                    {error}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <nav
          aria-label="Form sections"
          className="flex flex-wrap gap-x-16 gap-y-8"
        >
          {sections.map((section, index) => (
            <a
              key={section}
              href={`#project-section-${index}`}
              className="text-gray-2 underline"
            >
              {section}
            </a>
          ))}
        </nav>
        <fieldset disabled={locked} className="min-w-0 space-y-24">
          <Section errors={errors} id="project-section-0" title="1. Basics">
            <div className="grid grid-cols-1 gap-20 sm:grid-cols-2">
              <Field
                name="name"
                label="Project name"
                required
                error={errors.name}
              >
                <input
                  {...inputProps("name")}
                  value={value.name}
                  maxLength={200}
                  onChange={(event) => update("name", event.target.value)}
                />
              </Field>
              <Field
                name="chapterId"
                label="Chapter"
                required
                error={errors.chapterId}
              >
                <select
                  {...inputProps("chapterId")}
                  value={value.chapterId}
                  disabled={chapters.length === 1}
                  onChange={(event) => update("chapterId", event.target.value)}
                >
                  <option value="">Select a chapter</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
                {chapters.length === 1 && (
                  <p className="text-gray-3">Assigned to your chapter.</p>
                )}
              </Field>
            </div>
            <fieldset className="space-y-8">
              <legend className="mb-8">Project stage</legend>
              <ol className="grid grid-cols-2 gap-8 sm:grid-cols-4">
                {stages.map((stage, index) => (
                  <li key={stage}>
                    <button
                      type="button"
                      aria-pressed={value.stage === stage}
                      className={`rounded-4 focus-visible:outline-focus w-full border px-12 py-10 text-left focus-visible:outline-2 ${value.stage === stage ? "border-blue-3 bg-panel" : "border-separator"}`}
                      onClick={() => update("stage", stage)}
                    >
                      <span className="text-gray-3 mr-8">{index + 1}</span>
                      {stageLabels[stage]}
                    </button>
                  </li>
                ))}
              </ol>
            </fieldset>
            <Field
              name="tagline"
              label="Tagline"
              required
              error={errors.tagline}
            >
              <input
                {...inputProps("tagline")}
                aria-describedby="project-tagline-counter"
                value={value.tagline || ""}
                maxLength={180}
                onChange={(event) => update("tagline", event.target.value)}
              />
              <p
                id="project-tagline-counter"
                className="text-gray-3 text-right"
              >
                {value.tagline?.length || 0}/180 characters
              </p>
            </Field>
            <div className="grid grid-cols-1 gap-20 sm:grid-cols-2">
              <Field
                name="techStack"
                label="Tech stack"
                error={errors.techStack}
              >
                <Tags
                  name="techStack"
                  value={value.techStack}
                  disabled={locked}
                  onChange={(tags) => update("techStack", tags)}
                />
              </Field>
              <Field
                name="causeAreas"
                label="Cause areas"
                error={errors.causeAreas}
              >
                <Tags
                  name="causeAreas"
                  value={value.causeAreas}
                  disabled={locked}
                  onChange={(tags) => update("causeAreas", tags)}
                />
              </Field>
            </div>
          </Section>
          <Section
            errors={errors}
            id="project-section-1"
            title="2. Nonprofit & Timeline"
          >
            <Field
              name="nonprofitPartnerName"
              label="Nonprofit partner name"
              required
              error={errors.nonprofitPartner || errors.nonprofitPartnerName}
            >
              <PartnerPicker
                id={fieldId("nonprofitPartnerName")}
                name={value.nonprofitPartnerName || ""}
                selectedId={value.nonprofitPartnerId}
                error={errors.nonprofitPartnerName || errors.nonprofitPartner}
                onChange={(partner) => {
                  setValue((previous) => ({
                    ...previous,
                    nonprofitPartnerId: partner.id || null,
                    nonprofitPartnerName: partner.name,
                    nonprofitPartnerPhoto: partner.id
                      ? partner.photo
                      : previous.nonprofitPartnerId
                        ? null
                        : previous.nonprofitPartnerPhoto,
                  }));
                  setErrors({});
                  setMessage("");
                }}
              />
            </Field>
            <Field
              name="nonprofitPartnerPhoto"
              label="Partner photo (optional)"
              error={errors.nonprofitPartnerPhoto}
            >
              <input
                id={fieldId("nonprofitPartnerPhoto")}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className={control}
                onChange={(event) => {
                  void upload(event.target.files, "partner-photo");
                  event.target.value = "";
                }}
              />
              {value.nonprofitPartnerPhoto && (
                <div className="mt-8 flex items-center gap-12">
                  <MediaPreview src={value.nonprofitPartnerPhoto} index={-1} />
                  <Button
                    type="button"
                    onClick={() => update("nonprofitPartnerPhoto", null)}
                  >
                    Remove partner photo
                  </Button>
                </div>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-20 sm:grid-cols-2">
              <Field
                name="startDate"
                label="Start date"
                required
                error={errors.startDate}
              >
                <input
                  {...inputProps("startDate")}
                  type="date"
                  value={value.startDate || ""}
                  onChange={(event) => update("startDate", event.target.value)}
                />
              </Field>
              <Field name="endDate" label="End date" error={errors.endDate}>
                <input
                  {...inputProps("endDate")}
                  type="date"
                  min={value.startDate || undefined}
                  value={value.endDate || ""}
                  onChange={(event) => update("endDate", event.target.value)}
                />
                <p className="text-gray-3">Leave blank if ongoing.</p>
              </Field>
            </div>
          </Section>
          <Section
            errors={errors}
            id="project-section-2"
            title="3. Project Goal"
          >
            <Field
              name="problemStatement"
              label="What problem were you solving?"
              required
              error={errors.problemStatement}
            >
              <textarea
                {...inputProps("problemStatement")}
                rows={5}
                maxLength={20000}
                value={value.problemStatement || ""}
                onChange={(event) =>
                  update("problemStatement", event.target.value)
                }
              />
            </Field>
            <Field
              name="goalStatement"
              label="What was your goal?"
              required
              error={errors.goalStatement}
            >
              <textarea
                {...inputProps("goalStatement")}
                rows={5}
                maxLength={20000}
                value={value.goalStatement || ""}
                onChange={(event) =>
                  update("goalStatement", event.target.value)
                }
              />
            </Field>
          </Section>
          <Section
            errors={errors}
            id="project-section-3"
            title="4. Team Members"
          >
            <div id={fieldId("teamMembers")} className="space-y-16">
              <p>
                Team roster{" "}
                <span className="text-red">
                  *<span className="sr-only"> required to publish</span>
                </span>
              </p>
              {value.teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 items-end gap-12 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <Field
                    name={`teamMembers.${index}.userId`}
                    label={`Team member ${index + 1}`}
                    error={errors[`teamMembers.${index}.userId`]}
                  >
                    <MemberPicker
                      id={fieldId(`teamMembers.${index}.userId`)}
                      value={member.userId}
                      options={memberOptions}
                      error={errors[`teamMembers.${index}.userId`]}
                      onSelect={(person) => {
                        setMemberOptions((previous) =>
                          previous.some((option) => option.id === person.id)
                            ? previous
                            : [...previous, person]
                        );
                        update(
                          "teamMembers",
                          value.teamMembers.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  userId: person.id,
                                  memberId: person.memberId,
                                  role: row.role || person.role,
                                }
                              : row
                          )
                        );
                      }}
                    />
                  </Field>
                  <Field
                    name={`teamMembers.${index}.role`}
                    label={`Role ${index + 1}`}
                    error={errors[`teamMembers.${index}.role`]}
                  >
                    <input
                      id={fieldId(`teamMembers.${index}.role`)}
                      className={control}
                      value={member.role}
                      maxLength={100}
                      placeholder="Project Lead, Designer, Developer…"
                      onChange={(event) =>
                        update(
                          "teamMembers",
                          value.teamMembers.map((row, i) =>
                            i === index
                              ? { ...row, role: event.target.value }
                              : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    aria-label={`Remove team member ${index + 1}`}
                    onClick={() =>
                      update(
                        "teamMembers",
                        value.teamMembers.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {errors.teamMembers && (
                <p className="text-red">{errors.teamMembers}</p>
              )}
              <Button
                type="button"
                disabled={value.teamMembers.length >= 100}
                onClick={() =>
                  update("teamMembers", [
                    ...value.teamMembers,
                    { userId: "", role: "" },
                  ])
                }
              >
                + Add Team Member
              </Button>
            </div>
          </Section>
          <Section errors={errors} id="project-section-4" title="5. Solution">
            <Field
              name="solutionDescription"
              label="Explain your solution and its impact"
              required={required.includes("solutionDescription")}
              error={errors.solutionDescription}
            >
              <textarea
                {...inputProps("solutionDescription")}
                rows={6}
                maxLength={20000}
                value={value.solutionDescription || ""}
                onChange={(event) =>
                  update("solutionDescription", event.target.value)
                }
              />
            </Field>
            <Field
              name="demoMedia"
              label="Demo photos and videos"
              error={errors.demoMedia}
            >
              <input
                id={fieldId("demoMedia")}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                multiple
                className={control}
                onChange={(event) => {
                  void upload(event.target.files);
                  event.target.value = "";
                }}
              />
              <p className="text-gray-3">
                PNG, JPEG, WebP, GIF, MP4 or WebM. Up to 20 MB per file; 50
                files per project.
              </p>
            </Field>
            <ul className="space-y-12">
              {value.demoMedia.map((url, index) => (
                <li
                  key={`${url}-${index}`}
                  className="border-separator rounded-4 flex flex-wrap items-center gap-12 border p-12"
                >
                  {/\.(mp4|webm)(?:\?|$)/i.test(url) ? (
                    <video
                      src={url}
                      controls
                      preload="metadata"
                      aria-label={`Demo video ${index + 1}`}
                      className="bg-panel h-100 w-160 object-contain"
                    />
                  ) : (
                    <MediaPreview src={url} index={index} />
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Open media {index + 1}
                  </a>
                  <Button
                    type="button"
                    onClick={() =>
                      update(
                        "demoMedia",
                        value.demoMedia.filter((_, i) => i !== index)
                      )
                    }
                    aria-label={`Remove media ${index + 1}`}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </Section>
          <Section
            errors={errors}
            id="project-section-5"
            title="6. Resource Links"
          >
            <div id={fieldId("resourceLinks")} className="space-y-16">
              <p>
                Project resources
                {required.includes("resourceLinks") && (
                  <span className="text-red">
                    {" "}
                    *<span className="sr-only"> required to publish</span>
                  </span>
                )}
              </p>
              {value.resourceLinks.map((link, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 items-end gap-12 sm:grid-cols-[180px_1fr_auto]"
                >
                  <Field
                    name={`resourceLinks.${index}.type`}
                    label={`Link type ${index + 1}`}
                  >
                    <select
                      id={fieldId(`resourceLinks.${index}.type`)}
                      className={control}
                      value={link.type}
                      onChange={(event) =>
                        update(
                          "resourceLinks",
                          value.resourceLinks.map((row, i) =>
                            i === index
                              ? {
                                  ...row,
                                  type: event.target.value as typeof link.type,
                                }
                              : row
                          )
                        )
                      }
                    >
                      {["Slack", "GitHub", "GoogleDrive", "Other"].map(
                        (type) => (
                          <option key={type} value={type}>
                            {type === "GoogleDrive" ? "Google Drive" : type}
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                  <Field
                    name={`resourceLinks.${index}.url`}
                    label={`URL ${index + 1}`}
                    error={errors[`resourceLinks.${index}.url`]}
                  >
                    <input
                      id={fieldId(`resourceLinks.${index}.url`)}
                      className={control}
                      type="url"
                      inputMode="url"
                      value={link.url}
                      aria-invalid={Boolean(
                        errors[`resourceLinks.${index}.url`]
                      )}
                      placeholder="https://…"
                      maxLength={2000}
                      onChange={(event) =>
                        update(
                          "resourceLinks",
                          value.resourceLinks.map((row, i) =>
                            i === index
                              ? { ...row, url: event.target.value }
                              : row
                          )
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    aria-label={`Remove resource link ${index + 1}`}
                    onClick={() =>
                      update(
                        "resourceLinks",
                        value.resourceLinks.filter((_, i) => i !== index)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
              {errors.resourceLinks && (
                <p className="text-red">{errors.resourceLinks}</p>
              )}
              <Button
                type="button"
                disabled={value.resourceLinks.length >= 100}
                onClick={() =>
                  update("resourceLinks", [
                    ...value.resourceLinks,
                    { type: "GitHub", url: "" },
                  ])
                }
              >
                + Add Link
              </Button>
            </div>
          </Section>
        </fieldset>
        <footer className="border-separator flex flex-wrap items-center justify-between gap-12 border-t pt-20">
          <Link
            href="/projects"
            onClick={(event) => void leave(event)}
            className="underline"
          >
            Back to projects
          </Link>
          <div className="flex gap-8">
            <Button type="submit" disabled={locked}>
              Save Draft
            </Button>
            <Button
              type="button"
              variant="high-contrast"
              disabled={locked}
              onClick={() => void save(true)}
            >
              Publish Changes
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
function MediaPreview({ src, index }: { src: string; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-gray-3">Preview unavailable</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={index < 0 ? "Partner photo" : `Demo photo ${index + 1}`}
      loading="lazy"
      className="bg-panel h-100 w-160 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
