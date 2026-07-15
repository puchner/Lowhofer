import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudflareEnv } from "../../_shared/env";
import { onRequestGet as getLeagueTable } from "../league/table";
import { onRequestPatch as patchLeagueSource } from "./league-source";

type TestContext = EventContext<CloudflareEnv, string, Record<string, unknown>>;

const mockState = vi.hoisted(() => ({
  cache: {} as Record<string, unknown>,
  teamSettings: {
    league_base_url: "https://www.volleyball-freizeit.de/saison/1083",
    league_table_url: "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1",
    league_fixtures_url: "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1",
  },
  writes: [] as Array<{ type: string; [key: string]: unknown }>,
}));

vi.mock("../../_shared/auth", () => ({
  requireAdmin: vi.fn(async () => ({
    selectedPlayerId: "admin-player",
    selectedPlayerIsAdmin: true,
    selectedPlayerRole: "member",
    session: { selectedPlayerId: "admin-player" },
  })),
  requireSelectedPlayer: vi.fn(async () => ({
    selectedPlayerId: "admin-player",
    selectedPlayerIsAdmin: true,
    selectedPlayerRole: "member",
    session: { selectedPlayerId: "admin-player" },
  })),
}));

vi.mock("../../_shared/supabase", () => ({
  getLeagueCache: vi.fn(async (_env: unknown, key: "table" | "fixtures") => mockState.cache[key] ?? null),
  getTeamLeagueSettings: vi.fn(async () => mockState.teamSettings),
  getTeamLeagueXmlUrls: vi.fn(async () => ({
    league_table_url: mockState.teamSettings.league_table_url,
    league_fixtures_url: mockState.teamSettings.league_fixtures_url,
  })),
  invalidateLeagueCache: vi.fn(async () => {
    delete mockState.cache.table;
    delete mockState.cache.fixtures;
    mockState.writes.push({ type: "invalidate-cache" });
  }),
  setLeagueCache: vi.fn(async (_env: unknown, key: "table" | "fixtures", payload: unknown, sourceUrl: string) => {
    mockState.cache[key] = {
      cache_key: key,
      payload_json: payload,
      fetched_at: "2026-07-15T10:00:00.000Z",
      expires_at: "2026-07-15T10:15:00.000Z",
      source_url: sourceUrl,
    };
    mockState.writes.push({ type: "set-cache", key, sourceUrl, payload });
  }),
  updateTeamLeagueSource: vi.fn(
    async (_env: unknown, baseUrl: string, tableUrl: string, fixturesUrl: string) => {
      mockState.teamSettings = {
        league_base_url: baseUrl,
        league_table_url: tableUrl,
        league_fixtures_url: fixturesUrl,
      };
      mockState.writes.push({ type: "update-settings", baseUrl, tableUrl, fixturesUrl });
    },
  ),
}));

describe("league source update", () => {
  beforeEach(() => {
    mockState.teamSettings = {
      league_base_url: "https://www.volleyball-freizeit.de/saison/1083",
      league_table_url: "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1",
      league_fixtures_url: "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1",
    };
    mockState.cache = {
      table: {
        cache_key: "table",
        payload_json: { standings: [{ team: "Alter Verein", points: 99 }], lastChange: "2026-01-01" },
        fetched_at: "2026-07-15T09:00:00.000Z",
        expires_at: "2026-07-15T09:15:00.000Z",
        source_url: "https://www.volleyball-freizeit.de/sprung_tabelle?i=1083&xml=1",
      },
      fixtures: {
        cache_key: "fixtures",
        payload_json: [{ id: "old-fixture" }],
        fetched_at: "2026-07-15T09:00:00.000Z",
        expires_at: "2026-07-15T09:15:00.000Z",
        source_url: "https://www.volleyball-freizeit.de/sprung_spielplan?i=1083&xml=1",
      },
    };
    mockState.writes = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = input.toString();

        if (url === "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1") {
          return new Response(
            `<league>
              <last_change>2026-07-15</last_change>
              <team>
                <name>Die lowhofer</name>
                <points positive="21" />
                <games_won>7</games_won>
                <sets positive="22" negative="5" />
                <balls positive="650" negative="501" />
                <games>8</games>
              </team>
            </league>`,
            { status: 200 },
          );
        }

        return new Response("not found", { status: 404 });
      }),
    );
  });

  it("updates base URL, derived XML URLs, invalidates stale league caches and reloads the table from the new source", async () => {
    const patchResponse = await patchLeagueSource({
      request: new Request("https://app.example/api/team-settings/league-source", {
        method: "PATCH",
        body: JSON.stringify({ seasonKey: "2042" }),
      }),
      env: {},
    } as TestContext);

    expect(patchResponse.status).toBe(200);
    await expect(patchResponse.json()).resolves.toEqual({
      seasonKey: "2042",
      leagueBaseUrl: "https://www.volleyball-freizeit.de/saison/2042",
      leagueTableUrl: "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1",
      leagueFixturesUrl: "https://www.volleyball-freizeit.de/sprung_spielplan?i=2042&xml=1",
    });

    expect(mockState.teamSettings).toEqual({
      league_base_url: "https://www.volleyball-freizeit.de/saison/2042",
      league_table_url: "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1",
      league_fixtures_url: "https://www.volleyball-freizeit.de/sprung_spielplan?i=2042&xml=1",
    });
    expect(mockState.cache).toEqual({});
    expect(mockState.writes.slice(0, 2)).toEqual([
      {
        type: "update-settings",
        baseUrl: "https://www.volleyball-freizeit.de/saison/2042",
        tableUrl: "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1",
        fixturesUrl: "https://www.volleyball-freizeit.de/sprung_spielplan?i=2042&xml=1",
      },
      { type: "invalidate-cache" },
    ]);

    const tableResponse = await getLeagueTable({
      request: new Request("https://app.example/api/league/table"),
      env: {},
    } as TestContext);

    expect(tableResponse.status).toBe(200);
    await expect(tableResponse.json()).resolves.toMatchObject({
      standings: [
        {
          team: "Die lowhofer",
          points: 21,
          wins: 7,
          setsWon: 22,
          setsLost: 5,
          ballsWon: 650,
          ballsLost: 501,
          games: 8,
        },
      ],
      lastChange: "2026-07-15",
      isStale: false,
    });
    expect(mockState.writes).toContainEqual(
      expect.objectContaining({
        type: "set-cache",
        key: "table",
        sourceUrl: "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1",
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://www.volleyball-freizeit.de/sprung_tabelle?i=2042&xml=1",
      expect.any(Object),
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
