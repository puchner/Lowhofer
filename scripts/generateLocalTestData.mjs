import { pbkdf2Sync, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(rootDir, "supabase/local/generated_test_data.sql");

const LEAGUE_BASE_URL = "https://www.volleyball-freizeit.de/schedule/overview/1083";
const LEAGUE_TABLE_URL = "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1";
const LEAGUE_FIXTURES_URL = "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1";
const LOWHOFER_TEAM_NAME = "Die lowhofer";
const TEAM_PASSWORD = "lowhofer-local";
const TEAM_PASSWORD_SALT = Buffer.from("lowhofer-local-1");
const PASSWORD_HASH_ITERATIONS = 100_000;
const PASSWORD_HASH_BYTES = 32;
const CACHE_DAYS = 3650;

const playerSpecs = [
  {
    name: "Pia",
    gender: "female",
    isAdmin: true,
    role: "member",
    positions: [
      { position: "setter", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "thumbs", seed: "Aneka" },
  },
  {
    name: "Volker",
    gender: "male",
    isAdmin: true,
    role: "member",
    positions: [
      { position: "outside", isPrimary: true },
      { position: "opposite", isPrimary: false },
    ],
    avatar: { style: "thumbs", seed: "Felix" },
  },
  {
    name: "Mara",
    gender: "female",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "outside", isPrimary: true },
      { position: "libero", isPrimary: false },
    ],
    avatar: { style: "croodles", seed: "Aria" },
  },
  {
    name: "Toni",
    gender: "male",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "middle", isPrimary: true },
      { position: "opposite", isPrimary: false },
    ],
    avatar: { style: "bottts", seed: "Bolt" },
  },
  {
    name: "Jule",
    gender: "female",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "setter", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "adventurer", seed: "Sophie" },
  },
  {
    name: "Robin",
    gender: "male",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "libero", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "big-ears", seed: "Robin" },
  },
  {
    name: "Kira",
    gender: "female",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "middle", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "toon-head", seed: "Kira" },
  },
  {
    name: "Basti",
    gender: "male",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "middle", isPrimary: true },
      { position: "setter", isPrimary: false },
    ],
    avatar: { style: "croodles", seed: "Basti" },
  },
  {
    name: "Sina",
    gender: "female",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "opposite", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "thumbs", seed: "Flo" },
  },
  {
    name: "Milo",
    gender: "male",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "setter", isPrimary: true },
      { position: "libero", isPrimary: false },
    ],
    avatar: { style: "adventurer", seed: "Milo" },
  },
  {
    name: "Franzi",
    gender: "female",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "middle", isPrimary: true },
      { position: "outside", isPrimary: false },
    ],
    avatar: { style: "big-ears", seed: "Franzi" },
  },
  {
    name: "Olli",
    gender: "male",
    isAdmin: false,
    role: "member",
    positions: [
      { position: "outside", isPrimary: true },
      { position: "opposite", isPrimary: false },
    ],
    avatar: { style: "toon-head", seed: "Olli" },
  },
  {
    name: "Lowhofer",
    gender: "diverse",
    isAdmin: false,
    role: "training_member",
    positions: [
      { position: "outside", isPrimary: true },
    ],
    avatar: { style: "bottts", seed: "Nova" },
  },
];

const tableXml = await fetchXml(LEAGUE_TABLE_URL);
const scheduleXml = await fetchXml(LEAGUE_FIXTURES_URL);
const standings = buildTestStandings(parseStandings(tableXml));
const officialFixtures = parseLowhoferFixtures(scheduleXml);
const localScenario = buildLocalScenario(officialFixtures);
const passwordHash = createPasswordHash(TEAM_PASSWORD);
const sql = buildSql({ localScenario, passwordHash, standings });

writeFileSync(outputPath, sql, "utf8");
console.log(`Wrote ${outputPath}`);
console.log(`Local password: ${TEAM_PASSWORD}`);

async function fetchXml(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function createPasswordHash(password) {
  const hash = pbkdf2Sync(password, TEAM_PASSWORD_SALT, PASSWORD_HASH_ITERATIONS, PASSWORD_HASH_BYTES, "sha256");

  return `pbkdf2-sha256$${PASSWORD_HASH_ITERATIONS}$${TEAM_PASSWORD_SALT.toString("base64")}$${hash.toString("base64")}`;
}

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

function buildTestStandings(rawStandings) {
  const overridesByTeam = new Map([
    [
      "blockbusters",
      {
        points: 13,
        wins: 5,
        setsWon: 17,
        setsLost: 16,
        ballsWon: 720,
        ballsLost: 710,
        games: 12,
      },
    ],
    [
      LOWHOFER_TEAM_NAME.trim().toLowerCase(),
      {
        points: 12,
        wins: 5,
        setsWon: 12,
        setsLost: 15,
        ballsWon: 592,
        ballsLost: 611,
        games: 12,
      },
    ],
    [
      "esv freimann",
      {
        points: 11,
        wins: 4,
        setsWon: 11,
        setsLost: 17,
        ballsWon: 592,
        ballsLost: 648,
        games: 12,
      },
    ],
  ]);

  return rawStandings.map((standing) => ({
    ...standing,
    ...(overridesByTeam.get(standing.team.trim().toLowerCase()) ?? {}),
  }));
}

function parseLowhoferFixtures(xmlText) {
  return [...xmlText.matchAll(/<game>([\s\S]*?)<\/game>/g)]
    .map((match) => parseGame(match[1]))
    .filter((fixture) => fixture !== null)
    .sort(compareFixtures);
}

function parseGame(gameXml) {
  const teamA = parseTeamName(gameXml, "team_a");
  const teamB = parseTeamName(gameXml, "team_b");
  const lowhoferIsTeamA = teamA === LOWHOFER_TEAM_NAME;
  const lowhoferIsTeamB = teamB === LOWHOFER_TEAM_NAME;

  if (!lowhoferIsTeamA && !lowhoferIsTeamB) {
    return null;
  }

  const newDate = normalizeFixtureDate(readTag(gameXml, "new_date"));
  const originalDate = normalizeFixtureDate(readTag(gameXml, "date"));
  const effectiveDate = newDate ?? originalDate ?? null;

  return {
    id: readTag(gameXml, "gamenr"),
    date: effectiveDate,
    time: normalizeTime(readTag(gameXml, "time")),
    opponent: lowhoferIsTeamA ? teamB : teamA,
    homeAway: lowhoferIsTeamA ? "home" : "away",
    originalState: readTag(gameXml, "state"),
  };
}

function buildLocalScenario(fixtures) {
  const selectedPastFixtures = fixtures.slice(0, 4);
  const selectedFutureFixtures = fixtures.slice(4, 10);
  const pastOffsets = [-70, -49, -28, -14];
  const futureOffsets = [7, 18, 32, 46, 60, null];

  const pastPolls = selectedPastFixtures.map((fixture, index) =>
    createPollScenario({
      fixture,
      offsetDays: pastOffsets[index],
      pollStatus: "archived",
      titlePrefix: "Gespielt gegen",
    }),
  );

  const scheduledFuturePolls = selectedFutureFixtures.slice(0, 2).map((fixture, index) =>
    createPollScenario({
      fixture,
      offsetDays: futureOffsets[index],
      pollStatus: "open",
      titlePrefix: "Spiel gegen",
    }),
  );

  const availableFixtures = selectedFutureFixtures
    .map((fixture, index) => ({
      ...fixture,
      date: futureOffsets[index] === null ? undefined : offsetDateKey(futureOffsets[index]),
      time: futureOffsets[index] === null ? undefined : fixture.time ?? defaultTimeForIndex(index),
      state: "new",
      source: "league",
    }))
    .sort((left, right) => (left.date ?? "9999-12-31").localeCompare(right.date ?? "9999-12-31"));

  return {
    availableFixtures,
    pastPolls,
    scheduledFuturePolls,
  };
}

function createPollScenario({ fixture, offsetDays, pollStatus, titlePrefix }) {
  const date = offsetDateKey(offsetDays);
  const time = fixture.time ?? "20:00";

  return {
    fixture,
    title: `${titlePrefix} ${fixture.opponent}`,
    pollStatus,
    appointmentStatus: "scheduled",
    date,
    time,
    location: fixture.homeAway === "home" ? "Sporthalle Hirschau" : "Auswaertshalle",
  };
}

function buildSql({ localScenario, passwordHash, standings }) {
  const nowIso = new Date().toISOString();
  const cacheExpiresIso = new Date(Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const teamSettingsId = stableUuid("team-settings");
  const players = playerSpecs.map((player) => ({
    ...player,
    id: stableUuid(`player:${player.name}`),
  }));

  const statements = [];

  statements.push("-- Generated local test data");
  statements.push("begin;");

  statements.push(`
insert into public.team_settings (
  id,
  team_name,
  team_slogan,
  team_password_hash,
  minimum_yes_players,
  mixed_minimum_women_on_field,
  libero_counts_as_full_woman,
  league_base_url,
  league_table_url,
  league_fixtures_url,
  created_at,
  updated_at
) values (
  ${sqlString(teamSettingsId)},
  ${sqlString("Lowhofer")},
  ${sqlString("Lokale Testumgebung mit realistischen Beispieldaten")},
  ${sqlString(passwordHash)},
  6,
  2,
  false,
  ${sqlString(LEAGUE_BASE_URL)},
  ${sqlString(LEAGUE_TABLE_URL)},
  ${sqlString(LEAGUE_FIXTURES_URL)},
  ${sqlString(nowIso)},
  ${sqlString(nowIso)}
);`.trim());

  for (const [index, player] of players.entries()) {
    statements.push(`
insert into public.players (
  id,
  display_name,
  gender,
  is_active,
  is_admin,
  role,
  sort_order,
  avatar_kind,
  avatar_style,
  avatar_seed,
  avatar_storage_path,
  created_at,
  updated_at
) values (
  ${sqlString(player.id)},
  ${sqlString(player.name)},
  ${sqlString(player.gender)},
  true,
  ${player.isAdmin ? "true" : "false"},
  ${sqlString(player.role)},
  ${index + 1},
  'generated',
  ${sqlString(player.avatar.style)},
  ${sqlString(player.avatar.seed)},
  null,
  ${sqlString(nowIso)},
  ${sqlString(nowIso)}
);`.trim());

    for (const position of player.positions) {
      statements.push(`
insert into public.player_positions (
  id,
  player_id,
  position,
  is_primary
) values (
  ${sqlString(stableUuid(`position:${player.name}:${position.position}`))},
  ${sqlString(player.id)},
  ${sqlString(position.position)},
  ${position.isPrimary ? "true" : "false"}
);`.trim());
    }
  }

  const allPollScenarios = [...localScenario.pastPolls, ...localScenario.scheduledFuturePolls];

  for (const [index, scenario] of allPollScenarios.entries()) {
    const matchId = stableUuid(`match:${scenario.fixture.id}`);
    const appointmentId = stableUuid(`appointment:${scenario.fixture.id}:${scenario.date}`);
    const pollId = stableUuid(`poll:${scenario.fixture.id}:${scenario.date}`);
    const startsAt = berlinDateTimeToIso(scenario.date, scenario.time);
    const createdByPlayerId = players[index % 2].id;

    statements.push(`
insert into public.matches (
  id,
  source_type,
  league_game_nr,
  season_key,
  team_key,
  opponent_name,
  home_away,
  notes,
  created_at,
  updated_at
) values (
  ${sqlString(matchId)},
  'league',
  ${sqlString(scenario.fixture.id)},
  ${sqlString("2025-26-local")},
  ${sqlString("lowhofer")},
  ${sqlString(scenario.fixture.opponent)},
  ${sqlString(scenario.fixture.homeAway)},
  null,
  ${sqlString(nowIso)},
  ${sqlString(nowIso)}
);`.trim());

    statements.push(`
insert into public.match_appointments (
  id,
  match_id,
  starts_at,
  has_time,
  status,
  location,
  source_type,
  cancelled_at,
  cancellation_reason,
  created_at,
  updated_at
) values (
  ${sqlString(appointmentId)},
  ${sqlString(matchId)},
  ${sqlString(startsAt)},
  true,
  ${sqlString(scenario.appointmentStatus)},
  ${sqlString(scenario.location)},
  'league',
  null,
  null,
  ${sqlString(nowIso)},
  ${sqlString(nowIso)}
);`.trim());

    statements.push(`
insert into public.availability_polls (
  id,
  match_appointment_id,
  title,
  poll_type,
  poll_status,
  notes,
  created_by_player_id,
  archived_at,
  created_at,
  updated_at
) values (
  ${sqlString(pollId)},
  ${sqlString(appointmentId)},
  ${sqlString(scenario.title)},
  'match',
  ${sqlString(scenario.pollStatus)},
  null,
  ${sqlString(createdByPlayerId)},
  ${scenario.pollStatus === "archived" ? sqlString(nowIso) : "null"},
  ${sqlString(nowIso)},
  ${sqlString(nowIso)}
);`.trim());

    for (const [playerIndex, player] of players.entries()) {
      const response = buildResponseForPlayer(playerIndex, index, scenario.pollStatus);

      statements.push(`
insert into public.availability_responses (
  id,
  poll_id,
  player_id,
  status,
  comment,
  updated_at
) values (
  ${sqlString(stableUuid(`response:${pollId}:${player.id}`))},
  ${sqlString(pollId)},
  ${sqlString(player.id)},
  ${sqlString(response.status)},
  ${response.comment ? sqlString(response.comment) : "null"},
  ${sqlString(nowIso)}
);`.trim());
    }
  }

  const fixturesPayload = {
    generatedAt: nowIso,
    fixtures: localScenario.availableFixtures.map((fixture) => ({
      id: fixture.id,
      date: fixture.date,
      time: fixture.time,
      opponent: fixture.opponent,
      homeAway: fixture.homeAway,
      state: fixture.state,
      source: fixture.source,
    })),
  };

  const tablePayload = {
    sourceUrl: LEAGUE_TABLE_URL,
    lastChange: new Date().toISOString().slice(0, 10),
    standings,
  };

  statements.push(buildLeagueCacheInsert({
    key: "table",
    payload: tablePayload,
    fetchedAt: nowIso,
    expiresAt: cacheExpiresIso,
    sourceUrl: LEAGUE_TABLE_URL,
  }));

  statements.push(buildLeagueCacheInsert({
    key: "fixtures",
    payload: fixturesPayload.fixtures,
    fetchedAt: nowIso,
    expiresAt: cacheExpiresIso,
    sourceUrl: LEAGUE_FIXTURES_URL,
  }));

  statements.push("commit;");
  statements.push("");

  return statements.join("\n\n");
}

function buildLeagueCacheInsert({ key, payload, fetchedAt, expiresAt, sourceUrl }) {
  return `
insert into public.league_cache (
  id,
  cache_key,
  payload_json,
  fetched_at,
  expires_at,
  source_url,
  etag,
  last_modified
) values (
  ${sqlString(stableUuid(`league-cache:${key}`))},
  ${sqlString(key)},
  ${sqlJson(payload)},
  ${sqlString(fetchedAt)},
  ${sqlString(expiresAt)},
  ${sqlString(sourceUrl)},
  null,
  null
);`.trim();
}

function buildResponseForPlayer(playerIndex, pollIndex, pollStatus) {
  if (pollStatus === "archived") {
    const statuses = ["available", "available", "maybe", "available", "unavailable", "available"];
    const status = statuses[(playerIndex + pollIndex) % statuses.length];

    return {
      status,
      comment: status === "unavailable" ? "Schon verplant." : null,
    };
  }

  const statuses = ["available", "maybe", "unknown", "available", "unavailable", "available"];
  const status = statuses[(playerIndex * 2 + pollIndex) % statuses.length];

  return {
    status,
    comment:
      status === "maybe"
        ? "Wenn ich rechtzeitig aus dem Buero komme."
        : status === "unavailable"
          ? "Bin an dem Abend nicht in Muenchen."
          : null,
  };
}

function compareFixtures(left, right) {
  const leftKey = left.date ?? "9999-12-31";
  const rightKey = right.date ?? "9999-12-31";

  return leftKey.localeCompare(rightKey) || left.id.localeCompare(right.id);
}

function parseTeamName(gameXml, tagName) {
  const match = gameXml.match(new RegExp(`<${tagName}([^>]*)\\/>`));
  const attrs = match?.[1] ?? "";

  return decodeXml(readAttribute(attrs, "name"));
}

function readTag(xmlText, tagName) {
  const match = xmlText.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

function readAttribute(attributeText, attributeName) {
  const match = attributeText.match(new RegExp(`${attributeName}="([^"]*)"`));
  return match?.[1] ?? "";
}

function readNumberAttribute(xmlText, tagName, attributeName) {
  const match = xmlText.match(new RegExp(`<${tagName}[^>]*${attributeName}="([^"]+)"`));
  return match ? Number(match[1]) : 0;
}

function normalizeFixtureDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function normalizeTime(value) {
  return /^\d{2}:\d{2}$/.test(value) ? value : null;
}

function defaultTimeForIndex(index) {
  return ["20:00", "19:30", "18:45", "20:15"][index % 4];
}

function offsetDateKey(offsetDays) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function berlinDateTimeToIso(dateKey, time = "00:00") {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = localAsUtcMs;

  for (let index = 0; index < 2; index += 1) {
    utcMs = localAsUtcMs - getTimeZoneOffsetMs(new Date(utcMs), "Europe/Berlin");
  }

  return new Date(utcMs).toISOString();
}

function getTimeZoneOffsetMs(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
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

function stableUuid(value) {
  const hex = createHash("sha1").update(value).digest("hex");
  const chars = hex.slice(0, 32).split("");
  chars[12] = "4";
  chars[16] = "8";

  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20, 32).join("")}`;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `$json$${JSON.stringify(value)}$json$::jsonb`;
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
