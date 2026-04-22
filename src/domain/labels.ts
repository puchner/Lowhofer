import { AvailabilityStatus, Gender, Position } from "./types";

export const positionLabels = Object.values(Position);

export const genderLabel: Record<Gender, string> = {
  [Gender.Female]: "Madl",
  [Gender.Male]: "Bua"
};

export const availabilityLabel: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.Available]: "Zugesagt",
  [AvailabilityStatus.Unavailable]: "Abgesagt",
  [AvailabilityStatus.Maybe]: "Unsicher",
  [AvailabilityStatus.Unknown]: "Keine Rückmeldung",
};
