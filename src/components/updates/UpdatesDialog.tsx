import { useEffect, useMemo, useRef } from "react";
import { AppUpdate } from "../../content/appUpdates";

type UpdatesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  updates: AppUpdate[];
  unreadUpdateIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  onOpen: () => void;
};

const categoryLabels: Record<NonNullable<AppUpdate["category"]>, string> = {
  feature: "Feature",
  improvement: "Verbesserung",
  fix: "Fix",
};

export function UpdatesDialog({
  isOpen,
  onClose,
  updates,
  unreadUpdateIds,
  isLoading,
  error,
  onOpen,
}: UpdatesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const hasMarkedOpenRef = useRef(false);
  const sortedUpdates = useMemo(() => [...updates].reverse(), [updates]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }

      if (!hasMarkedOpenRef.current) {
        hasMarkedOpenRef.current = true;
        onOpen();
      }

      return;
    }

    hasMarkedOpenRef.current = false;

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen, onOpen]);

  return (
    <dialog className="modal" onCancel={onClose} ref={dialogRef}>
      <div className="modal-box max-h-[85vh] max-w-2xl rounded-lg bg-base-100 p-0 text-base-content">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-base-300 bg-base-100 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Updates</p>
            <h2 className="text-2xl font-black text-petrol-900">Was gibts Neues?</h2>
          </div>
          <button
            aria-label="Updates schließen"
            className="btn btn-ghost btn-sm h-9 min-h-0 w-9 rounded-lg p-0 text-xl"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="max-h-[calc(85vh-84px)] overflow-y-auto px-4 py-4">


          {isLoading ? <p className="mb-4 text-sm font-semibold text-base-content/60">Updates werden geprüft...</p> : null}

          {sortedUpdates.length > 0 ? (
            <ol className="space-y-3">
              {sortedUpdates.map((update) => {
                const isNew = unreadUpdateIds.has(update.id);

                return (
                  <li
                    className={`rounded-lg border px-3 py-3 ${
                      isNew ? "border-secondary bg-secondary/10" : "border-base-300 bg-base-100"
                    }`}
                    key={update.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {isNew ? <span className="badge badge-secondary text-petrol-900">Neu</span> : null}
                      {update.category ? (
                        <span className="badge badge-outline">{categoryLabels[update.category]}</span>
                      ) : null}
                      <time className="text-xs font-bold uppercase tracking-wide text-base-content/50" dateTime={update.publishedAt}>
                        {formatUpdateDate(update.publishedAt)}
                      </time>
                    </div>
                    <h3 className="mt-2 text-lg font-black text-petrol-900">{update.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-base-content/75">{update.description}</p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="rounded-lg border border-base-300 bg-base-200 px-4 py-6 text-center">
              <p className="font-bold text-base-content/70">Noch keine Updates vorhanden.</p>
            </div>
          )}
        </div>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button onClick={onClose} type="button">
          schließen
        </button>
      </form>
    </dialog>
  );
}

function formatUpdateDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
