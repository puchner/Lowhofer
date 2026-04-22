import { MatchDay } from "./types";

export type MatchDayGroup =
  | { kind: "single"; matchDay: MatchDay }
  | { kind: "group"; matchId: string; label: string; matchDays: MatchDay[] };

export function groupMatchDays(matchDays: MatchDay[]): MatchDayGroup[] {
  const grouped = new Map<string, MatchDay[]>();

  for (const matchDay of matchDays) {
    const key = matchDay.matchId ?? matchDay.id;
    const bucket = grouped.get(key) ?? [];
    bucket.push(matchDay);
    grouped.set(key, bucket);
  }

  const result: MatchDayGroup[] = [];

  for (const group of grouped.values()) {
    const sortedGroup = [...group].sort((left, right) => left.date.localeCompare(right.date));

    if (sortedGroup.length === 1 || !sortedGroup.every((item) => item.type === "date-finding")) {
      result.push(...sortedGroup.map((matchDay) => ({ kind: "single" as const, matchDay })));
      continue;
    }

    result.push({
      kind: "group",
      label: sortedGroup[0].opponent,
      matchDays: sortedGroup,
      matchId: sortedGroup[0].matchId ?? sortedGroup[0].id,
    });
  }

  return result;
}
