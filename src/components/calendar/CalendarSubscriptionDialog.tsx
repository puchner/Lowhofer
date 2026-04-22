import { Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CalendarSubscriptionDialogProps = {
  isOpen: boolean;
  feedUrl: string | null;
  webcalUrl: string | null;
  onClose: () => void;
};

export function CalendarSubscriptionDialog({
  isOpen,
  feedUrl,
  webcalUrl,
  onClose,
}: CalendarSubscriptionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }

      return;
    }

    if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCopyState("idle");
    }
  }, [isOpen, feedUrl]);

  async function handleCopyFeedUrl() {
    if (!feedUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <dialog className="modal" onCancel={onClose} ref={dialogRef}>
      <div className="modal-box max-w-xl rounded-lg bg-base-100 p-0 text-base-content">
        <div className="flex items-center justify-between gap-3 border-b border-base-300 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-primary">Kalender-Abo</p>
            <h2 className="text-2xl font-black text-petrol-900">Feed abonnieren</h2>
          </div>
          <button
            aria-label="Kalenderdialog schließen"
            className="btn btn-ghost btn-sm h-9 min-h-0 w-9 rounded-lg p-0 text-xl"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="rounded-lg border border-base-300 bg-base-200 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-base-content/60">Feed-URL</p>
            <p className="mt-2 break-all font-mono text-sm text-petrol-900">{feedUrl ?? "Feed wird geladen..."}</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              className="btn rounded-lg bg-primary text-primary-content"
              disabled={!feedUrl}
              onClick={() => void handleCopyFeedUrl()}
              type="button"
            >
              {copyState === "copied" ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
              {copyState === "copied" ? "URL kopiert" : "URL kopieren"}
            </button>

            {webcalUrl ? (
              <a className="btn rounded-lg bg-base-200 text-base-content" href={webcalUrl}>
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
                Mit Kalender-App versuchen
              </a>
            ) : null}
          </div>

          {copyState === "error" ? (
            <p className="text-sm font-semibold text-error">URL konnte nicht automatisch kopiert werden.</p>
          ) : null}

          <div className="space-y-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-sm text-base-content/80">
            <p className="font-semibold text-petrol-900">Typische Nutzung</p>
            <p>Google Kalender: Weitere Kalender oder Andere Kalender, dann "Per URL" und die Feed-URL einfuegen.</p>
            <p>Desktop-Kalender: In Apple Kalender, Outlook oder Thunderbird einen Kalender per Internetadresse abonnieren.</p>
          </div>
        </div>
      </div>
      <form className="modal-backdrop" method="dialog">
        <button onClick={onClose} type="button">
          schliessen
        </button>
      </form>
    </dialog>
  );
}
