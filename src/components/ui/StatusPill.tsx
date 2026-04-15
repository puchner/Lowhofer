import { AvailabilityStatus } from "../../domain/types";
import { availabilityLabel } from "../../domain/labels";

interface StatusPillProps {
  status: AvailabilityStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const classes: Record<AvailabilityStatus, string> = {
    [AvailabilityStatus.Available]: "badge-success",
    [AvailabilityStatus.Unavailable]: "badge-error",
    [AvailabilityStatus.Maybe]: "badge-warning",
    [AvailabilityStatus.Unknown]: "badge-ghost",
  };

  return <span className={`badge ${classes[status]}`}>{availabilityLabel[status]}</span>;
}
