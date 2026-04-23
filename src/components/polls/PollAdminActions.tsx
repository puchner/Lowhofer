import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface PollAdminActionsProps {
  matchDayId: string;
  canFinalize: boolean;
  onDelete: () => void;
  onFinalize: () => void;
  size?: "sm" | "md";
}

export function PollAdminActions({
  canFinalize,
  matchDayId,
  onDelete,
  onFinalize,
  size = "sm",
}: PollAdminActionsProps) {
  const isMedium = size === "md";
  const buttonClassName = isMedium
    ? "btn h-8 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-base-content"
    : "btn h-7 min-h-0 rounded-lg bg-base-200 px-2 py-0 text-xs leading-none text-base-content";
  const iconClassName = isMedium ? "h-4 w-4" : "h-3.5 w-3.5";
  const finalizeButtonClassName = isMedium
    ? "btn h-8 min-h-0 rounded-lg bg-primary px-2 py-0 text-primary-content"
    : "btn h-7 min-h-0 rounded-lg bg-primary px-2 py-0 text-xs leading-none text-primary-content";

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {canFinalize ? (
        <button
          className={finalizeButtonClassName}
          onClick={onFinalize}
          title="Als finalen Termin festlegen"
          type="button"
        >
          Festlegen
        </button>
      ) : null}
      <Link
        aria-label="Abstimmung bearbeiten"
        className={buttonClassName}
        title="Bearbeiten"
        to={`/polls/${matchDayId}/edit`}
      >
        <Pencil aria-hidden="true" className={iconClassName} strokeWidth={2} />
      </Link>
      <button
        aria-label="Abstimmung löschen"
        className={`${buttonClassName} text-error hover:bg-error hover:text-white`}
        onClick={onDelete}
        title="Löschen"
        type="button"
      >
        <Trash2 aria-hidden="true" className={iconClassName} strokeWidth={2} />
      </button>
    </div>
  );
}
