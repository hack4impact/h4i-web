"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { Lock, Plus, TriangleAlert, X } from "lucide-react";
import type { LinkType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import {
  Form,
  FormDescription,
  FormError,
  FormField,
  FormInput,
  FormLabel,
  FormSelect,
  FormTextarea,
} from "@/components/ui/Form";
import { browserRequest, GraphQLRequestError } from "@/lib/graphql/request";
import {
  findContactInfo,
  type ContactInfoKind,
} from "@/lib/sourced-projects/contact-detection";
import {
  createListingInput,
  MAX_LINKS,
  updateListingInput,
} from "@/lib/sourced-projects/listing-input";
import {
  CAUSE_AREA_LABELS,
  LINK_TYPE_LABELS,
} from "@/lib/sourced-projects/labels";
import {
  createListingsApi,
  type Chapter,
  type ListingDetail,
  type ListingInput,
} from "@/lib/sourced-projects/listings-api";

const listingsApi = createListingsApi(browserRequest);

type TextFieldName =
  | "title"
  | "description"
  | "scope"
  | "techContext"
  | "handoffNotes"
  | "clientOrgName"
  | "clientContactName"
  | "clientContactEmail"
  | "clientContactPhone"
  | "partnerNotes";

type Values = Record<TextFieldName, string> & {
  causeArea: string;
  sourcingChapterId: string;
};

type LinkRow = { key: number; label: string; url: string; linkType: LinkType };

type Errors = Record<string, string>;

let nextLinkKey = 0;
const linkRow = (link?: ListingDetail["links"][number]): LinkRow => ({
  key: nextLinkKey++,
  label: link?.label ?? "",
  url: link?.url ?? "",
  linkType: (link?.linkType as LinkType) ?? "OTHER",
});

function initialValues(listing?: ListingDetail): Values {
  const contact = listing?.contact;
  return {
    sourcingChapterId: "",
    title: listing?.title ?? "",
    causeArea: listing?.causeArea ?? "",
    description: listing?.description ?? "",
    scope: listing?.scope ?? "",
    techContext: listing?.techContext ?? "",
    handoffNotes: listing?.handoffNotes ?? "",
    clientOrgName: contact?.clientOrgName ?? "",
    clientContactName: contact?.clientContactName ?? "",
    clientContactEmail: contact?.clientContactEmail ?? "",
    clientContactPhone: contact?.clientContactPhone ?? "",
    partnerNotes: contact?.partnerNotes ?? "",
  };
}

const toErrors = (issues: { path: string; message: string }[]): Errors =>
  Object.fromEntries(
    // Keep the first message when a field has several problems.
    issues.toReversed().map((issue) => [issue.path, issue.message])
  );

const CONTACT_INFO_NAMES: Record<ContactInfoKind, string> = {
  email: "an email address",
  phone: "a phone number",
};

// Every member can read the public fields, so this nudges contact details into
// the gated Client contact section. It doesn't block saving.
function ContactInfoWarning({ text }: { text: string }) {
  const kinds = findContactInfo(text);
  if (kinds.length === 0) return null;
  return (
    <p className="flex items-start gap-6 bg-(--badge-orange-bg) px-8 py-6 text-(--badge-orange-fg)">
      <TriangleAlert size={12} strokeWidth={1.75} className="mt-2 shrink-0" />
      <span>
        This looks like{" "}
        {kinds.map((kind) => CONTACT_INFO_NAMES[kind]).join(" and ")}. Every
        member can read this field, so put client contact details in the Client
        contact section below.
      </span>
    </p>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-16">
      <div className="space-y-4">
        <h2 className="text-gray-1 text-xl">{title}</h2>
        {description && <p className="text-gray-3">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const Optional = () => <span className="text-gray-3"> (optional)</span>;

// Post a new listing, or edit one when `listing` is given. Admins have no
// chapter, so creating as an admin also needs `chapters` to pick from.
export function ListingForm({
  listing,
  chapters,
}: {
  listing?: ListingDetail;
  chapters?: Chapter[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() => initialValues(listing));
  const [links, setLinks] = useState(() => (listing?.links ?? []).map(linkRow));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cancelHref = listing ? `/exchange/${listing.id}` : "/exchange";

  const set = (name: keyof Values) => (value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const updateLink = (key: number, patch: Partial<LinkRow>) =>
    setLinks((current) =>
      current.map((link) => (link.key === key ? { ...link, ...patch } : link))
    );

  function showErrors(next: Errors) {
    setErrors(next);
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLElement>(
          "input[data-invalid], textarea[data-invalid], select[data-invalid]"
        )
        ?.focus()
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const { sourcingChapterId, ...fields } = values;
    const raw = {
      ...fields,
      links: links.map(({ label, url, linkType }) => ({
        label,
        url,
        linkType,
      })),
      ...(chapters && { sourcingChapterId: sourcingChapterId || null }),
    };

    // Same schema the API validates with, so errors show before a round trip.
    const parsed = (
      listing ? updateListingInput : createListingInput
    ).safeParse(raw);
    if (!parsed.success) {
      showErrors(
        toErrors(
          parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          }))
        )
      );
      return;
    }
    if (chapters && !sourcingChapterId) {
      showErrors({ sourcingChapterId: "Choose the sourcing chapter" });
      return;
    }

    const input = parsed.data as ListingInput & { sourcingChapterId?: string };
    startTransition(async () => {
      try {
        const { id } = listing
          ? await listingsApi.updateListing(listing.id, input)
          : await listingsApi.createListing(input);
        router.push(`/exchange/${id}`);
        router.refresh();
      } catch (error) {
        if (error instanceof GraphQLRequestError && error.issues.length > 0) {
          showErrors(toErrors(error.issues));
        } else {
          setFormError(
            error instanceof GraphQLRequestError
              ? error.message
              : "Couldn't save the listing. Try again."
          );
        }
      }
    });
  }

  // Inputs use inputMode rather than type="email"/"url": the browser's own
  // constraint check would block submit without showing our error messages.
  const textField = (
    name: TextFieldName,
    label: string,
    {
      optional = false,
      description,
      rows,
      inputMode,
      warnOnContactInfo = false,
    }: {
      optional?: boolean;
      description?: string;
      rows?: number;
      inputMode?: "email" | "tel";
      warnOnContactInfo?: boolean;
    } = {}
  ) => (
    <FormField name={name}>
      <FormLabel>
        {label}
        {optional && <Optional />}
      </FormLabel>
      {description && <FormDescription>{description}</FormDescription>}
      {rows ? (
        <FormTextarea
          name={name}
          rows={rows}
          value={values[name]}
          onValueChange={set(name)}
          disabled={pending}
        />
      ) : (
        <FormInput
          name={name}
          inputMode={inputMode}
          value={values[name]}
          onValueChange={set(name)}
          disabled={pending}
        />
      )}
      {warnOnContactInfo && <ContactInfoWarning text={values[name]} />}
      <FormError />
    </FormField>
  );

  return (
    <Form
      ref={formRef}
      onSubmit={handleSubmit}
      errors={errors}
      noValidate
      className="max-w-[720px] gap-32"
    >
      <Section title="Project">
        {chapters && (
          <FormField name="sourcingChapterId">
            <FormLabel>Sourcing chapter</FormLabel>
            <FormSelect
              name="sourcingChapterId"
              value={values.sourcingChapterId}
              onValueChange={set("sourcingChapterId")}
              disabled={pending}
            >
              <option value="">Choose a chapter</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </FormSelect>
            <FormError />
          </FormField>
        )}
        {textField("title", "Title", { warnOnContactInfo: true })}
        <FormField name="causeArea">
          <FormLabel>Cause area</FormLabel>
          <FormSelect
            name="causeArea"
            value={values.causeArea}
            onValueChange={set("causeArea")}
            disabled={pending}
          >
            <option value="">Choose a cause area</option>
            {Object.entries(CAUSE_AREA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormSelect>
          <FormError />
        </FormField>
        {textField("description", "Project overview", {
          rows: 5,
          description: "What the nonprofit needs and why.",
          warnOnContactInfo: true,
        })}
        {textField("scope", "Scope", {
          rows: 4,
          description: "What's in and out of scope for the claiming chapter.",
          warnOnContactInfo: true,
        })}
        {textField("techContext", "Tech context", {
          optional: true,
          rows: 2,
          description: "Existing stack, hosting, or constraints.",
          warnOnContactInfo: true,
        })}
        {textField("handoffNotes", "Handoff notes", {
          rows: 4,
          description:
            "What the claiming chapter should know: history, open questions, next steps.",
          warnOnContactInfo: true,
        })}
      </Section>

      <Section title="Links" description="Repos, scoping docs, designs.">
        {links.length > 0 && (
          <ul className="space-y-12">
            {links.map((link, index) => (
              <li
                key={link.key}
                className="grid grid-cols-1 items-start gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_140px_auto]"
              >
                <FormField name={`links.${index}.label`}>
                  <FormLabel className="sr-only">
                    Link {index + 1} label
                  </FormLabel>
                  <FormInput
                    placeholder="Label"
                    value={link.label}
                    onValueChange={(label) => updateLink(link.key, { label })}
                    disabled={pending}
                  />
                  <FormError />
                </FormField>
                <FormField name={`links.${index}.url`}>
                  <FormLabel className="sr-only">
                    Link {index + 1} URL
                  </FormLabel>
                  <FormInput
                    inputMode="url"
                    placeholder="https://"
                    value={link.url}
                    onValueChange={(url) => updateLink(link.key, { url })}
                    disabled={pending}
                  />
                  <FormError />
                </FormField>
                <FormField name={`links.${index}.linkType`}>
                  <FormLabel className="sr-only">
                    Link {index + 1} type
                  </FormLabel>
                  <FormSelect
                    value={link.linkType}
                    onValueChange={(linkType) =>
                      updateLink(link.key, { linkType: linkType as LinkType })
                    }
                    disabled={pending}
                  >
                    {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-32 w-32"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() =>
                    setLinks((current) =>
                      current.filter((row) => row.key !== link.key)
                    )
                  }
                  disabled={pending}
                >
                  <X size={12} strokeWidth={1.75} />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {links.length < MAX_LINKS && (
          <Button
            type="button"
            onClick={() => setLinks((current) => [...current, linkRow()])}
            disabled={pending}
          >
            <Plus size={12} strokeWidth={1.75} />
            Add link
          </Button>
        )}
      </Section>

      <Section
        title="Client contact"
        description={
          <span className="inline-flex items-center gap-4">
            <Lock size={11} strokeWidth={1.75} />
            Only chapter leaders and admins can see this section.
          </span>
        }
      >
        {textField("clientOrgName", "Nonprofit name")}
        {textField("clientContactName", "Contact name")}
        {textField("clientContactEmail", "Contact email", {
          inputMode: "email",
        })}
        {textField("clientContactPhone", "Contact phone", {
          optional: true,
          inputMode: "tel",
        })}
        {textField("partnerNotes", "Partner notes", {
          optional: true,
          rows: 3,
          description: "Relationship history or anything sensitive.",
        })}
      </Section>

      <div className="border-separator flex flex-col gap-12 border-t pt-24">
        {formError && (
          <p role="alert" className="text-red">
            {formError}
          </p>
        )}
        <div className="flex items-center gap-8">
          <Button
            type="submit"
            variant="high-contrast"
            size="lg"
            disabled={pending}
          >
            {pending ? "Saving…" : listing ? "Save changes" : "Post project"}
          </Button>
          <Link href={cancelHref} className="btn btn-ghost btn-lg">
            Cancel
          </Link>
        </div>
      </div>
    </Form>
  );
}
