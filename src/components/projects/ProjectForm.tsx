"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  formErrors,
  formPayload,
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
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="border-separator rounded-6 scroll-mt-16 space-y-20 border p-20 sm:p-24"
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
}: {
  initial?: ProjectPatch;
  projectId?: string | null;
  isDraft?: boolean;
  chapters: { id: string; name: string }[];
  members: { id: string; name: string }[];
}) {
  const [value, setValue] = useState(() =>
    formValue({
      chapterId: chapters.length === 1 ? chapters[0].id : "",
      ...initial,
    })
  );
  const [projectId, setProjectId] = useState(initialId);
  const [isDraft, setIsDraft] = useState(initialDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const required: readonly string[] = requiredByStage[value.stage];
  function update<K extends keyof ProjectFormValue>(
    name: K,
    next: ProjectFormValue[K]
  ) {
    setValue((previous) => ({ ...previous, [name]: next }));
    setErrors({});
    setMessage("Unsaved changes");
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
      const missing = error.details?.missingFields;
      if (missing)
        setErrors(
          Object.fromEntries(
            missing.map((key) => [
              key,
              `${labels[key] || key} is required to publish at ${stageLabels[value.stage]}.`,
            ])
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
    const invalid = formErrors(value);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      setMessage("Check the fields below. Your changes have not been saved.");
      return;
    }
    setBusy(true);
    setMessage(publish ? "Saving and publishing…" : "Saving draft…");
    try {
      const saved = await projectClient.save(projectId, formPayload(value));
      setProjectId(saved.id);
      setValue(formValue(saved));
      // Native history updates preserve in-progress UI state while making reload
      // reopen the actual saved record, including after a publish validation error.
      if (!initialId)
        window.history.replaceState(
          null,
          "",
          `/projects/${encodeURIComponent(saved.id)}/edit`
        );
      if (publish) {
        await projectClient.publish(saved.id);
        setIsDraft(false);
        setMessage("Changes published.");
      } else setMessage("Draft saved.");
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    if (!value.name.trim() || !value.chapterId) {
      setMessage("Enter a project name and chapter before uploading media.");
      return;
    }
    if (value.demoMedia.length + selectedFiles.length > 50) {
      setMessage("A project may have up to 50 media files.");
      return;
    }
    setBusy(true);
    setMessage("Uploading media…");
    const uploaded: string[] = [];
    try {
      let id = projectId;
      if (!id) {
        const created = await projectClient.save(null, {
          name: value.name,
          chapterId: value.chapterId,
          stage: value.stage,
        });
        id = created.id;
        setProjectId(id);
      }
      for (const file of selectedFiles)
        uploaded.push((await projectClient.upload(id, file)).url);
      setMessage("Media uploaded. Save draft to keep your changes.");
    } catch (error) {
      report(error);
    } finally {
      if (uploaded.length)
        setValue((previous) => ({
          ...previous,
          demoMedia: [...previous.demoMedia, ...uploaded],
        }));
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
        <Link href="/projects" className="underline">
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
            <Link href="/projects" className="text-gray-2 underline">
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
            <Button type="submit" disabled={busy}>
              Save Draft
            </Button>
            <Button
              type="button"
              variant="high-contrast"
              disabled={busy}
              onClick={() => void save(true)}
            >
              Publish Changes
            </Button>
          </div>
        </header>
        <p role="status" aria-live="polite" className="text-gray-2 min-h-16">
          {message}
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
        <fieldset disabled={busy} className="min-w-0 space-y-24">
          <Section id="project-section-0" title="1. Basics">
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
                  disabled={busy}
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
                  disabled={busy}
                  onChange={(tags) => update("causeAreas", tags)}
                />
              </Field>
            </div>
          </Section>
          <Section id="project-section-1" title="2. Nonprofit & Timeline">
            <Field
              name="nonprofitPartnerName"
              label="Nonprofit partner name"
              required
              error={errors.nonprofitPartner || errors.nonprofitPartnerName}
            >
              <input
                {...inputProps("nonprofitPartnerName")}
                aria-required={true}
                value={value.nonprofitPartnerName || ""}
                maxLength={200}
                onChange={(event) => {
                  update("nonprofitPartnerName", event.target.value);
                  setValue((previous) => ({
                    ...previous,
                    nonprofitPartnerId: null,
                  }));
                }}
              />
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
          <Section id="project-section-2" title="3. Project Goal">
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
          <Section id="project-section-3" title="4. Team Members">
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
                    <select
                      id={fieldId(`teamMembers.${index}.userId`)}
                      className={control}
                      value={member.userId}
                      onChange={(event) =>
                        update(
                          "teamMembers",
                          value.teamMembers.map((row, i) =>
                            i === index
                              ? { ...row, userId: event.target.value }
                              : row
                          )
                        )
                      }
                    >
                      <option value="">Select a member</option>
                      {members.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
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
          <Section id="project-section-4" title="5. Solution">
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
          <Section id="project-section-5" title="6. Resource Links">
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
          <Link href="/projects" className="underline">
            Back to projects
          </Link>
          <div className="flex gap-8">
            <Button type="submit" disabled={busy}>
              Save Draft
            </Button>
            <Button
              type="button"
              variant="high-contrast"
              disabled={busy}
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
      alt={`Demo photo ${index + 1}`}
      loading="lazy"
      className="bg-panel h-100 w-160 object-contain"
      onError={() => setFailed(true)}
    />
  );
}
