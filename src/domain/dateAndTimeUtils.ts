export function formatMatchDateTime(date?: string, time?: string): string {
  if (!date) {
    return "Termin offen";
  }

  return `${formatShortGermanDate(date)}${time ? ` um ${time}` : ""}`;
}

export function formatShortGermanDate(date: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}
