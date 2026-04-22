import { DbMatchAppointmentWithMatchRow } from "../../src/data/supabaseMappers";

const CALENDAR_ID = "lowhofer-calendar";
const PRODUCT_ID = "-//Lowhofer//Match Calendar//DE";
const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;
const APP_TIME_ZONE = "Europe/Berlin";

export interface CalendarFeedEntry {
  appointment: DbMatchAppointmentWithMatchRow;
  participants: string[];
}

export function buildCalendarIcs(entries: CalendarFeedEntry[], now = new Date()): string {
  const events = entries
    .filter((entry) => entry.appointment.status === "scheduled" && entry.appointment.starts_at)
    .map((entry) => buildEvent(entry, now));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText("Lowhofer Spiele")}`,
    `X-WR-CALDESC:${escapeText("Spieltermine der Lowhofer")}`,
    ...events,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

function buildEvent(entry: CalendarFeedEntry, now: Date): string {
  const { appointment, participants } = entry;
  const match = appointment.matches;
  const startsAt = new Date(appointment.starts_at as string);
  const summary = buildSummary(match?.opponent_name ?? "Spiel", match?.home_away ?? "unknown");
  const lines = [
    "BEGIN:VEVENT",
    `UID:${appointment.id}@${CALENDAR_ID}`,
    `DTSTAMP:${formatUtcDateTime(now)}`,
    `SUMMARY:${escapeText(summary)}`,
  ];

  if (appointment.has_time) {
    lines.push(`DTSTART:${formatUtcDateTime(startsAt)}`);
    lines.push(`DTEND:${formatUtcDateTime(new Date(startsAt.getTime() + DEFAULT_EVENT_DURATION_MS))}`);
  } else {
    const startDate = formatBerlinDate(startsAt);
    const endDate = addDaysToDateKey(startDate, 1);

    lines.push(`DTSTART;VALUE=DATE:${startDate.replaceAll("-", "")}`);
    lines.push(`DTEND;VALUE=DATE:${endDate.replaceAll("-", "")}`);
  }

  if (appointment.location) {
    lines.push(`LOCATION:${escapeText(appointment.location)}`);
  }

  if (participants.length > 0) {
    lines.push(`DESCRIPTION:${escapeText(`Zusagen: ${participants.join(", ")}`)}`);
  }

  lines.push("END:VEVENT");

  return lines.join("\r\n");
}

function buildSummary(opponentName: string, homeAway: "home" | "away" | "unknown"): string {
  if (homeAway === "home") {
    return `Lowhofer vs ${opponentName}`;
  }

  if (homeAway === "away") {
    return `${opponentName} vs Lowhofer`;
  }

  return `Lowhofer - ${opponentName}`;
}

export function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r?\n/g, "\\n");
}

function formatUtcDateTime(date: Date): string {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function formatBerlinDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}
