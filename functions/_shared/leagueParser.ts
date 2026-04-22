export interface ParsedLeagueStanding {
  team: string;
  points: number;
  wins: number;
  setsWon: number;
  setsLost: number;
  ballsWon: number;
  ballsLost: number;
  games: number;
}

export interface ParsedLeagueFixture {
  id: string;
  date: string | undefined;
  time: string | undefined;
  opponent: string;
  homeAway: "home" | "away";
  state: "new";
  source: "league";
}

export interface ParsedLeagueTable {
  standings: ParsedLeagueStanding[];
  lastChange: string;
}

const LOWHOFER_TEAM_NAME = "Die lowhofer";

export function parseLeagueTable(xmlText: string): ParsedLeagueTable {
  const standings = [...xmlText.matchAll(/<team>([\s\S]*?)<\/team>/g)].map((match) => {
    const teamXml = match[1];

    return {
      team: readTag(teamXml, "name"),
      points: readNumberAttribute(teamXml, "points", "positive"),
      wins: Number(readTag(teamXml, "games_won")),
      setsWon: readNumberAttribute(teamXml, "sets", "positive"),
      setsLost: readNumberAttribute(teamXml, "sets", "negative"),
      ballsWon: readNumberAttribute(teamXml, "balls", "positive"),
      ballsLost: readNumberAttribute(teamXml, "balls", "negative"),
      games: Number(readTag(teamXml, "games")),
    };
  });

  const lastChange = readTag(xmlText, "last_change") || new Date().toISOString().slice(0, 10);

  return { standings, lastChange };
}

export function parseLowhoferFixtures(xmlText: string): ParsedLeagueFixture[] {
  return [...xmlText.matchAll(/<game>([\s\S]*?)<\/game>/g)]
    .map((match) => parseGame(match[1]))
    .filter((fixture): fixture is ParsedLeagueFixture => fixture !== null)
    .sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"));
}

function parseGame(gameXml: string): ParsedLeagueFixture | null {
  const todayKey = new Date().toISOString().slice(0, 10);
  const teamA = parseTeamName(gameXml, "team_a");
  const teamB = parseTeamName(gameXml, "team_b");
  const lowhoferIsTeamA = teamA === LOWHOFER_TEAM_NAME;
  const lowhoferIsTeamB = teamB === LOWHOFER_TEAM_NAME;

  if (!lowhoferIsTeamA && !lowhoferIsTeamB) {
    return null;
  }

  const state = readTag(gameXml, "state");

  if (state !== "new") {
    return null;
  }

  const newDate = readTag(gameXml, "new_date");
  const originalDate = readTag(gameXml, "date");
  const effectiveDate = isDateKey(newDate)
    ? newDate
    : isDateKey(originalDate) && originalDate >= todayKey
      ? originalDate
      : undefined;
  const opponent = lowhoferIsTeamA ? teamB : teamA;

  return {
    id: readTag(gameXml, "gamenr"),
    date: effectiveDate,
    time: normalizeOptional(readTag(gameXml, "time")),
    opponent,
    homeAway: lowhoferIsTeamA ? "home" : "away",
    state: "new",
    source: "league",
  };
}

function parseTeamName(gameXml: string, tagName: string): string {
  const match = gameXml.match(new RegExp(`<${tagName}([^>]*)\\/>`));
  const attrs = match?.[1] ?? "";

  return decodeXml(readAttribute(attrs, "name"));
}

function readAttribute(attributeText: string, attributeName: string): string {
  const match = attributeText.match(new RegExp(`${attributeName}="([^"]*)"`));

  return match?.[1] ?? "";
}

function normalizeOptional(value: string): string | undefined {
  return value && value !== "?" && value !== "-" ? value : undefined;
}

function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readTag(xmlText: string, tagName: string): string {
  const match = xmlText.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));

  return match ? decodeXml(match[1].trim()) : "";
}

function readNumberAttribute(xmlText: string, tagName: string, attributeName: string): number {
  const match = xmlText.match(new RegExp(`<${tagName}[^>]*${attributeName}="([^"]+)"`));

  return match ? Number(match[1]) : 0;
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&apos;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&#xFC;", "ü")
    .replaceAll("&#xE4;", "ä")
    .replaceAll("&#xF6;", "ö")
    .replaceAll("&#xDF;", "ß");
}
