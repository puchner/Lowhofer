import { LeagueFixture, MatchDay } from "./types";

export interface SuggestionDraft {
  date: string;
  time: string;
}

export interface NormalizedSuggestion {
  date: string;
  time?: string;
}

export function createEmptySuggestionDraft(): SuggestionDraft {
  return {
    date: "",
    time: "",
  };
}

export function createSuggestionDraftFromFixture(fixture: Pick<LeagueFixture, "date" | "time">): SuggestionDraft {
  return {
    date: fixture.date ?? "",
    time: fixture.time ?? "",
  };
}

export function normalizeSuggestionDrafts(suggestions: SuggestionDraft[]): NormalizedSuggestion[] {
  return suggestions
    .map((suggestion) => ({
      date: suggestion.date.trim(),
      time: suggestion.time.trim() || undefined,
    }))
    .filter((suggestion) => suggestion.date);
}

export function canFinalizeAppointment(matchDay: Pick<MatchDay, "type" | "appointmentStatus">): boolean {
  return matchDay.type === "date-finding" && matchDay.appointmentStatus === "planned";
}

export function getMatchDaySourceFixtureId(
  matchDay: Pick<MatchDay, "sourceFixtureId" | "leagueGameNr">,
): string | undefined {
  return matchDay.sourceFixtureId ?? matchDay.leagueGameNr ?? undefined;
}

export function getBlockedLeagueFixtureIds(
  matchDays: Array<Pick<MatchDay, "status" | "leagueGameNr" | "sourceFixtureId">>,
): Set<string> {
  return new Set(
    matchDays
      .filter((matchDay) => matchDay.status === "open")
      .map((matchDay) => matchDay.leagueGameNr ?? matchDay.sourceFixtureId)
      .filter((fixtureId): fixtureId is string => Boolean(fixtureId)),
  );
}

export function getOpenLeagueFixtures(
  leagueFixtures: LeagueFixture[],
  matchDays: Array<Pick<MatchDay, "status" | "leagueGameNr" | "sourceFixtureId">>,
): LeagueFixture[] {
  const blockedFixtureIds = getBlockedLeagueFixtureIds(matchDays);

  return leagueFixtures.filter((fixture) => !blockedFixtureIds.has(fixture.id));
}

export function buildCreatePollInputForFixture(
  fixture: Pick<LeagueFixture, "id" | "opponent" | "homeAway">,
  suggestions: NormalizedSuggestion[],
) {
  const firstSuggestion = suggestions[0];

  return {
    title: fixture.opponent,
    type: suggestions.length === 1 ? ("match" as const) : ("date-finding" as const),
    date: suggestions.length === 1 ? firstSuggestion?.date : undefined,
    time: suggestions.length === 1 ? firstSuggestion?.time : undefined,
    opponent: fixture.opponent,
    homeAway: fixture.homeAway,
    sourceFixtureId: fixture.id,
    suggestions: suggestions.length > 1 ? suggestions : undefined,
  };
}

export function buildCreatePollInputForMatchDay(
  matchDay: Pick<MatchDay, "title" | "opponent" | "homeAway" | "sourceFixtureId" | "leagueGameNr">,
  suggestions: NormalizedSuggestion[],
) {
  const firstSuggestion = suggestions[0];

  return {
    title: matchDay.title,
    type: suggestions.length === 1 ? ("match" as const) : ("date-finding" as const),
    date: suggestions.length === 1 ? firstSuggestion?.date : undefined,
    time: suggestions.length === 1 ? firstSuggestion?.time : undefined,
    opponent: matchDay.opponent,
    homeAway: matchDay.homeAway,
    sourceFixtureId: getMatchDaySourceFixtureId(matchDay),
    suggestions: suggestions.length > 1 ? suggestions : undefined,
  };
}
