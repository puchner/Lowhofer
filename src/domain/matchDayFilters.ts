import { MatchDay } from "./types";

export function getUpcomingMatchDays(matchDays: MatchDay[], limit = 3, today = new Date()): MatchDay[] {
  const upcomingMatchDays = getAllUpcomingMatchDays(matchDays, today);

  return upcomingMatchDays.slice(0, limit);
}

export function getAllUpcomingMatchDays(matchDays: MatchDay[], today = new Date()): MatchDay[] {
  const todayKey = toDateKey(today);

  return matchDays.filter((matchDay) => matchDay.status === "open" && matchDay.date >= todayKey);
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
