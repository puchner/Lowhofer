import { writeFile } from "node:fs/promises";

const TABLE_XML_URL = "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1";
const SCHEDULE_XML_URL = "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1";
const TABLE_OUTPUT_FILE = new URL("../src/data/leagueSnapshot.generated.json", import.meta.url);
const FIXTURES_OUTPUT_FILE = new URL("../src/data/leagueFixtures.generated.json", import.meta.url);
const LOWHOFER_TEAM_NAME = "Die lowhofer";
const todayKey = new Date().toISOString().slice(0, 10);

const tableResponse = await fetch(TABLE_XML_URL);

if (!tableResponse.ok) {
  throw new Error(`Liga-Tabelle konnte nicht geladen werden: ${tableResponse.status} ${tableResponse.statusText}`);
}

const tableXml = await tableResponse.text();
const standings = parseStandings(tableXml);
const lastChange = readTag(tableXml, "last_change") || todayKey;

await writeFile(
  TABLE_OUTPUT_FILE,
  `${JSON.stringify(
    {
      sourceUrl: TABLE_XML_URL,
      lastChange,
      standings,
    },
    null,
    2,
  )}\n`,
);

console.log(`Imported ${standings.length} teams from ${TABLE_XML_URL}`);
console.log(`Last change: ${lastChange}`);

const scheduleResponse = await fetch(SCHEDULE_XML_URL);

if (!scheduleResponse.ok) {
  throw new Error(
    `Liga-Spielplan konnte nicht geladen werden: ${scheduleResponse.status} ${scheduleResponse.statusText}`,
  );
}

const scheduleXml = await scheduleResponse.text();
const fixtures = parseLowhoferFixtures(scheduleXml);

await writeFile(FIXTURES_OUTPUT_FILE, `${JSON.stringify(fixtures, null, 2)}\n`);

console.log(`Imported ${fixtures.length} Lowhofer fixtures from ${SCHEDULE_XML_URL}`);

function parseStandings(xmlText) {
  return [...xmlText.matchAll(/<team>([\s\S]*?)<\/team>/g)].map((match) => {
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
}

function parseLowhoferFixtures(xmlText) {
  return [...xmlText.matchAll(/<game>([\s\S]*?)<\/game>/g)]
    .map((match) => parseGame(match[1]))
    .filter(Boolean)
    .filter((fixture) => fixture.date === undefined || fixture.date >= todayKey)
    .sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"));
}

function parseGame(gameXml) {
  const teamA = parseTeam(gameXml, "team_a");
  const teamB = parseTeam(gameXml, "team_b");
  const lowhoferIsTeamA = teamA.name === LOWHOFER_TEAM_NAME;
  const lowhoferIsTeamB = teamB.name === LOWHOFER_TEAM_NAME;

  if (!lowhoferIsTeamA && !lowhoferIsTeamB) {
    return null;
  }

  const state = readTag(gameXml, "state");

  if (state !== "new") {
    return null;
  }

  const newDate = readTag(gameXml, "new_date");
  const originalDate = readTag(gameXml, "date");
  const effectiveDate = isDateKey(newDate) ? newDate : isDateKey(originalDate) ? originalDate : undefined;
  const opponent = lowhoferIsTeamA ? teamB.name : teamA.name;

  return {
    id: readTag(gameXml, "gamenr"),
    date: effectiveDate,
    time: normalizeOptional(readTag(gameXml, "time")),
    opponent,
    homeAway: lowhoferIsTeamA ? "home" : "away",
    state,
    source: "league",
  };
}

function parseTeam(gameXml, tagName) {
  const match = gameXml.match(new RegExp(`<${tagName}([^>]*)\\/>`));
  const attrs = match?.[1] ?? "";

  return {
    name: decodeXml(readAttribute(attrs, "name")),
  };
}

function readAttribute(attributeText, attributeName) {
  const match = attributeText.match(new RegExp(`${attributeName}="([^"]*)"`));
  return match?.[1] ?? "";
}

function normalizeOptional(value) {
  return value && value !== "?" && value !== "-" ? value : undefined;
}

function isDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function readTag(xmlText, tagName) {
  const match = xmlText.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

function readNumberAttribute(xmlText, tagName, attributeName) {
  const match = xmlText.match(new RegExp(`<${tagName}[^>]*${attributeName}="([^"]+)"`));
  return match ? Number(match[1]) : 0;
}

function decodeXml(value) {
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
