"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/Button";
import { projectClient, ProjectRequestError } from "@/lib/projects/client";

export function DeleteProject({
  id,
  name,
  disabled = false,
  onOpenChange,
  beforeDelete,
}: {
  id: string;
  name: string;
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
  beforeDelete?: () => Promise<unknown>;
}) {
  const router = useRouter();
  const cancel = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  async function remove() {
    if (pending || denied) return;
    setPending(true);
    setError("");
    try {
      await beforeDelete?.();
      try {
        await projectClient.remove(id);
      } catch (failure) {
        if (!(failure instanceof ProjectRequestError && failure.status === 404))
          throw failure;
      }
      setOpen(false);
      router.replace("/projects");
      router.refresh();
    } catch (failure) {
      if (
        failure instanceof ProjectRequestError &&
        [401, 403].includes(failure.status)
      ) {
        setDenied(true);
        setError(
          "Your access has changed. The project was not deleted. Reload to refresh your permissions."
        );
      } else setError("Could not delete this project. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next, details) => {
        if (pending) {
          details.cancel();
          return;
        }
        setOpen(next);
        setError("");
        setDenied(false);
        onOpenChange?.(next);
      }}
    >
      <AlertDialog.Trigger
        type="button"
        disabled={disabled}
        className="btn text-red"
      >
        Delete Project
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/40" />
        <AlertDialog.Popup
          initialFocus={cancel}
          className="border-separator bg-root rounded-6 fixed top-1/2 left-1/2 z-50 w-[min(480px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 space-y-20 border p-24 shadow-xl"
        >
          <AlertDialog.Title className="text-xl">
            Delete project?
          </AlertDialog.Title>
          <AlertDialog.Description className="text-gray-2">
            Permanently delete “{name || "Untitled project"}”, including its
            drafts, team roster, resource links and uploaded media. This cannot
            be undone.
          </AlertDialog.Description>
          {error && (
            <p role="alert" className="text-red">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-12">
            <AlertDialog.Close
              ref={cancel}
              type="button"
              disabled={pending}
              className="btn"
            >
              Cancel
            </AlertDialog.Close>
            <Button
              type="button"
              variant="high-contrast"
              disabled={pending || denied}
              onClick={() => void remove()}
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
