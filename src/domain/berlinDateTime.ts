const BERLIN_TIME_ZONE = "Europe/Berlin";

export function berlinDateTimeToIso(date: string, time = "00:00"): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = localAsUtcMs;

  for (let index = 0; index < 2; index += 1) {
    utcMs = localAsUtcMs - getTimeZoneOffsetMs(new Date(utcMs), BERLIN_TIME_ZONE);
  }

  return new Date(utcMs).toISOString();
}

export function splitIsoInBerlin(isoValue: string): { date: string; time?: string } {
  const parts = getBerlinParts(new Date(isoValue), true);
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;

  return {
    date,
    time: time === "00:00" ? undefined : time,
  };
}

export function getBerlinTime(isoValue: string): string | undefined {
  return splitIsoInBerlin(isoValue).time;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getBerlinParts(date, false, timeZone);
  const zonedAsUtcMs = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return zonedAsUtcMs - date.getTime();
}

function getBerlinParts(
  date: Date,
  withoutSeconds: true,
  timeZone?: string,
): Record<"year" | "month" | "day" | "hour" | "minute", string>;
function getBerlinParts(
  date: Date,
  withoutSeconds: false,
  timeZone?: string,
): Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;
function getBerlinParts(date: Date, withoutSeconds: boolean, timeZone = BERLIN_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withoutSeconds ? {} : { second: "2-digit" }),
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const base = {
    year: getPart(parts, "year"),
    month: getPart(parts, "month"),
    day: getPart(parts, "day"),
    hour: getPart(parts, "hour"),
    minute: getPart(parts, "minute"),
  };

  if (withoutSeconds) {
    return base;
  }

  return {
    ...base,
    second: getPart(parts, "second"),
  };
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part) => part.type === type)?.value ?? "";
}
