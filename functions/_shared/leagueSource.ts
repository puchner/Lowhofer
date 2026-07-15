export interface DerivedLeagueUrls {
  baseUrl: string;
  tableUrl: string;
  fixturesUrl: string;
}

const LEAGUE_ORIGIN = "https://www.volleyball-freizeit.de";

export function validateSeasonKey(seasonKey: string): boolean {
  return /^\d+$/.test(seasonKey.trim());
}

export function extractSeasonKeyFromLeagueBaseUrl(baseUrl: string | null | undefined): string | null {
  return baseUrl?.match(/\/saison\/(\d+)/)?.[1] ?? null;
}

export function deriveLeagueUrls(seasonKey: string): DerivedLeagueUrls {
  const normalizedSeasonKey = seasonKey.trim();

  if (!validateSeasonKey(normalizedSeasonKey)) {
    throw new Error("ungueltige_saison_id");
  }

  const baseUrl = `${LEAGUE_ORIGIN}/saison/${normalizedSeasonKey}`;
  return {
    baseUrl,
    tableUrl: `${LEAGUE_ORIGIN}/sprung_tabelle?i=${normalizedSeasonKey}&xml=1`,
    fixturesUrl: `${LEAGUE_ORIGIN}/sprung_spielplan?i=${normalizedSeasonKey}&xml=1`,
  };
}
