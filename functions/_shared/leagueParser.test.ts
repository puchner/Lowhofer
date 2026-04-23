import { describe, expect, it, vi } from "vitest";
import { parseLowhoferFixtures } from "./leagueParser";

describe("parseLowhoferFixtures", () => {
  it("keeps open postponed matches without a new date, but clears the expired original date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-22T10:00:00.000Z"));

    const fixtures = parseLowhoferFixtures(`
      <games>
        <game>
          <gamenr>35</gamenr>
          <state>new</state>
          <date>2026-04-10</date>
          <new_date></new_date>
          <time>20:00</time>
          <team_a name="Die lowhofer"/>
          <team_b name="TSV Test"/>
        </game>
        <game>
          <gamenr>36</gamenr>
          <state>new</state>
          <date>2026-05-01</date>
          <new_date></new_date>
          <time>19:30</time>
          <team_a name="Die lowhofer"/>
          <team_b name="SV Zukunft"/>
        </game>
      </games>
    `);

    expect(fixtures).toEqual([
      {
        id: "36",
        date: "2026-05-01",
        time: "19:30",
        opponent: "SV Zukunft",
        homeAway: "home",
        state: "new",
        source: "league",
      },
      {
        id: "35",
        date: undefined,
        time: "20:00",
        opponent: "TSV Test",
        homeAway: "home",
        state: "new",
        source: "league",
      },
    ]);

    vi.useRealTimers();
  });
});
