import { LeagueFixture, MatchDay, PollType } from "./types";

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

export function resolvePollTypeForSuggestions(
  suggestionCount: number,
  singleSuggestionType: PollType = "match",
): PollType {
  return suggestionCount === 1 ? singleSuggestionType : "date-finding";
}

export function canFinalizeAppointment(matchDay: Pick<MatchDay, "type" | "appointmentStatus">): boolean {
  return matchDay.type === "date-finding" && matchDay.appointmentStatus === "planned";
}

export function shouldConvertCurrentPollToSuggestion(
  matchDay: Pick<MatchDay, "id" | "type" | "appointmentStatus">,
  visibleSuggestionIds: string[],
  finalSuggestionCount: number,
): boolean {
  return (
    visibleSuggestionIds.includes(matchDay.id) &&
    !canFinalizeAppointment(matchDay) &&
    finalSuggestionCount > 1
  );
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
  singleSuggestionType: PollType = "match",
) {
  const firstSuggestion = suggestions[0];
  const type = resolvePollTypeForSuggestions(suggestions.length, singleSuggestionType);

  return {
    title: fixture.opponent,
    type,
    date: type === "match" ? firstSuggestion?.date : undefined,
    time: type === "match" ? firstSuggestion?.time : undefined,
    opponent: fixture.opponent,
    homeAway: fixture.homeAway,
    sourceFixtureId: fixture.id,
    suggestions: type === "date-finding" ? suggestions : undefined,
  };
}

export function buildCreatePollInputForMatchDay(
  matchDay: Pick<MatchDay, "title" | "opponent" | "homeAway" | "sourceFixtureId" | "leagueGameNr">,
  suggestions: NormalizedSuggestion[],
  singleSuggestionType: PollType = "match",
) {
  const firstSuggestion = suggestions[0];
  const type = resolvePollTypeForSuggestions(suggestions.length, singleSuggestionType);

  return {
    title: matchDay.title,
    type,
    date: type === "match" ? firstSuggestion?.date : undefined,
    time: type === "match" ? firstSuggestion?.time : undefined,
    opponent: matchDay.opponent,
    homeAway: matchDay.homeAway,
    sourceFixtureId: getMatchDaySourceFixtureId(matchDay),
    suggestions: type === "date-finding" ? suggestions : undefined,
  };
}
