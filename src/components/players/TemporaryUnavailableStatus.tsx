import { Ambulance, Ban, Plane } from "lucide-react";
import type { TemporaryUnavailabilityReason } from "../../domain/types";

const reasonIcons = {
  illness_injury: Ambulance,
  travel: Plane,
  other: Ban,
} satisfies Record<TemporaryUnavailabilityReason, typeof Ambulance>;

const reasonLabels: Record<TemporaryUnavailabilityReason, string> = {
  illness_injury: "Verletzung/Krankheit",
  travel: "Reise",
  other: "Sonstiges",
};

export function TemporaryUnavailableStatus({
  note,
  reason,
  variant = "inline",
}: {
  note?: string;
  reason: TemporaryUnavailabilityReason;
  variant?: "inline" | "header";
}) {
  const Icon = reasonIcons[reason];
  const isHeader = variant === "header";
  const content = (
    <>
      <Icon
        aria-label={reasonLabels[reason]}
        className={`h-5 w-5 shrink-0 ${isHeader ? "text-white/60" : "text-base-content/50"}`}
        role="img"
      />
      {note?.trim() ? (
        <span className={`min-w-0 text-xs font-medium ${isHeader ? "text-white/80" : "text-base-content/70"}`}>
          {note}
        </span>
      ) : null}
    </>
  );

  if (variant === "header") {
    return (
      <span className="inline-flex min-w-0 items-center gap-2 text-white/75">
        {content}
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {content}
    </span>
  );
}
