import { AvailabilityStatus, Gender, Position } from "./types";

export const positionLabels = Object.values(Position);

export const genderLabel: Record<Gender, string> = {
  [Gender.Female]: "Dame",
  [Gender.Male]: "Herr",
  [Gender.Diverse]: "Divers",
};

export const availabilityLabel: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.Available]: "Zugesagt",
  [AvailabilityStatus.Unavailable]: "Abgesagt",
  [AvailabilityStatus.Maybe]: "Unsicher",
  [AvailabilityStatus.Unknown]: "Keine Rückmeldung",
};
