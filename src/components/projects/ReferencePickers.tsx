"use client";

import { useEffect, useState } from "react";
import { memberReferences, partnerReferences } from "@/lib/projects/client";
import type {
  MemberReference,
  PartnerReference,
} from "@/lib/projects/references";

const control =
  "border-separator bg-control focus-visible:outline-focus w-full rounded-4 border px-12 py-8 focus-visible:outline-2";
export function MemberAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  return (
    <span
      aria-hidden="true"
      className="bg-panel text-gray-2 flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
    >
      {initials || "?"}
    </span>
  );
}
export function MemberPicker({
  id,
  value,
  options,
  onSelect,
  error,
}: {
  id: string;
  value: string;
  options: MemberReference[];
  onSelect: (person: MemberReference) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [found, setFound] = useState<{
    query: string;
    members: MemberReference[];
    error?: string;
  }>({ query: "", members: options });
  const [picked, setPicked] = useState<MemberReference | null>(null);
  const selected =
    options.find((member) => member.id === value) ||
    (picked?.id === value ? picked : null);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      memberReferences(query.trim(), controller.signal).then(
        (data) => {
          if (!controller.signal.aborted)
            setFound({ query, members: data.members });
        },
        () => {
          if (!controller.signal.aborted)
            setFound({
              query,
              members: [],
              error: "Member search is unavailable. Try again.",
            });
        }
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);
  const list = found.query === query ? found.members : [];
  function choose(member: MemberReference) {
    setPicked(member);
    onSelect(member);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div className="relative space-y-8">
      <div className="flex items-center gap-8">
        <MemberAvatar name={selected?.name || "?"} />
        <input
          id={id}
          maxLength={100}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? `${id}-options` : undefined}
          aria-activedescendant={
            open && active >= 0 ? `${id}-option-${active}` : undefined
          }
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={control}
          placeholder="Search member records…"
          value={open ? query : selected?.name || ""}
          onFocus={() => {
            setQuery("");
            setOpen(true);
            setActive(-1);
          }}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
            if (["ArrowDown", "ArrowUp"].includes(event.key) && list.length) {
              event.preventDefault();
              setActive((previous) =>
                event.key === "ArrowDown"
                  ? (previous + 1) % list.length
                  : previous <= 0
                    ? list.length - 1
                    : previous - 1
              );
            }
            if (event.key === "Enter" && open) {
              event.preventDefault();
              if (active >= 0 && list[active]) choose(list[active]);
            }
          }}
        />
      </div>
      {selected?.memberId && (
        <p className="text-gray-3">Linked to Member Directory</p>
      )}
      {open && (
        <div className="border-separator bg-root rounded-6 absolute z-20 max-h-240 w-full overflow-y-auto border p-4 shadow-lg">
          <ul id={`${id}-options`} role="listbox" aria-label="Member records">
            {list.map((member, index) => (
              <li key={member.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${id}-option-${index}`}
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(member)}
                  className={`rounded-4 hover:bg-panel flex w-full items-center gap-8 px-8 py-8 text-left ${index === active ? "bg-panel" : ""}`}
                >
                  <MemberAvatar name={member.name} />
                  <span>
                    {member.name}
                    <span className="text-gray-3 block">{member.role}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {!list.length && (
            <p role="status" className="text-gray-3 p-8">
              {found.query !== query
                ? "Searching members…"
                : found.error || "No shared member profiles found."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function PartnerPicker({
  id,
  name,
  selectedId,
  onChange,
  error,
}: {
  id: string;
  name: string;
  selectedId: string | null;
  onChange: (partner: PartnerReference) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{
    q: string;
    partners: PartnerReference[];
    available: boolean;
  }>({ q: "", partners: [], available: true });
  useEffect(() => {
    if (!open || !name.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      partnerReferences(name.trim(), controller.signal).then(
        (data) => {
          if (!controller.signal.aborted) setResult({ q: name, ...data });
        },
        () => {
          if (!controller.signal.aborted)
            setResult({ q: name, partners: [], available: false });
        }
      );
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [name, open]);
  const list = result.q === name ? result.partners : [];
  function choose(partner: PartnerReference) {
    onChange(partner);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div className="relative space-y-8">
      <input
        id={id}
        className={control}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && Boolean(name.trim())}
        aria-controls={open && name.trim() ? `${id}-options` : undefined}
        aria-activedescendant={
          open && active >= 0 ? `${id}-option-${active}` : undefined
        }
        aria-invalid={Boolean(error)}
        aria-required={true}
        aria-describedby={error ? `${id}-error` : undefined}
        value={name}
        maxLength={200}
        placeholder="Search partners or enter a new name"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange({ id: "", name: event.target.value, photo: null });
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setActive(-1);
          }
          if (["ArrowDown", "ArrowUp"].includes(event.key) && list.length) {
            event.preventDefault();
            setActive((previous) =>
              event.key === "ArrowDown"
                ? (previous + 1) % list.length
                : previous <= 0
                  ? list.length - 1
                  : previous - 1
            );
          }
          if (event.key === "Enter" && open) {
            event.preventDefault();
            if (active >= 0 && list[active]) choose(list[active]);
            else setOpen(false);
          }
        }}
      />
      <p className="text-gray-3">
        {selectedId
          ? "Linked to Partner Directory"
          : "Free-text partner name; choose a result to link a directory record."}
      </p>
      {open && name.trim() && (
        <div className="border-separator bg-root rounded-6 absolute z-20 max-h-240 w-full overflow-y-auto border p-4 shadow-lg">
          <ul
            id={`${id}-options`}
            role="listbox"
            aria-label="Partner Directory results"
          >
            {list.map((partner, index) => (
              <li key={partner.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${id}-option-${index}`}
                  aria-selected={index === active}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(partner)}
                  className={`rounded-4 hover:bg-panel w-full px-12 py-10 text-left ${index === active ? "bg-panel" : ""}`}
                >
                  {partner.name}
                </button>
              </li>
            ))}
          </ul>
          <p role="status" className="text-gray-3 p-8">
            {result.q !== name
              ? "Searching Partner Directory…"
              : !result.available
                ? "Partner Directory unavailable. You can save this name as free text."
                : !list.length
                  ? "No matching partner. You can save this name as free text."
                  : "Choose a partner, or keep your typed name."}
          </p>
        </div>
      )}
    </div>
  );
}
