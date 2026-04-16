import { useCallback, useMemo, useState } from "react";
import { OxHeadMark } from "../branding/OxHeadMark";
import { UpdatesDialog } from "../updates/UpdatesDialog";
import { useAppUpdates } from "../../hooks/useAppUpdates";

type OxUpdatesButtonProps = {
  isShaking: boolean;
};

const oxHeadMarkClassName =
  "h-14 w-16 shrink-0 text-neon drop-shadow-[0_6px_0_rgba(0,0,0,0.24)] sm:h-20 sm:w-24";

export function OxUpdatesButton({ isShaking }: OxUpdatesButtonProps) {
  const { allUpdates, unreadUpdates, unreadCount, isLoading, error, markAllAsSeen } = useAppUpdates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [unreadUpdateIdsSnapshot, setUnreadUpdateIdsSnapshot] = useState<Set<string>>(new Set());

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);
  const markClassName = isShaking ? `${oxHeadMarkClassName} animate-ox-shake` : oxHeadMarkClassName;

  const handleOpen = useCallback(() => {
    setUnreadUpdateIdsSnapshot(new Set(unreadUpdates.map((update) => update.id)));
    setIsDialogOpen(true);
  }, [unreadUpdates]);

  const handleClose = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  const unreadUpdateIds = useMemo(() => unreadUpdateIdsSnapshot, [unreadUpdateIdsSnapshot]);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label="Was kann der Ox?"
        className="relative inline-flex shrink-0 rounded-lg border-0 bg-transparent p-0 transition-transform hover:scale-105 active:scale-95"
        onClick={handleOpen}
        title="Was kann der Ox?"
        type="button"
      >
        <OxHeadMark className={markClassName} />
        {unreadCount > 0 ? (
          <span className="badge badge-accent absolute -right-0.5 -top-0.5 h-4 min-h-4 min-w-4 rounded-full px-1 text-[10px] font-black leading-none text-white shadow">
            {badgeLabel}
          </span>
        ) : null}
      </button>
      <UpdatesDialog
        error={error}
        isLoading={isLoading}
        isOpen={isDialogOpen}
        onClose={handleClose}
        onOpen={markAllAsSeen}
        unreadUpdateIds={unreadUpdateIds}
        updates={allUpdates}
      />
    </>
  );
}
