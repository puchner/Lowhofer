import { describe, expect, it } from "vitest";
import { DEFAULT_SEASON_KEY, extractSeasonKey } from "./leagueContext";

describe("extractSeasonKey", () => {
  it("reads the season id from a league base url", () => {
    expect(extractSeasonKey("https://www.volleyball-freizeit.de/saison/1083")).toBe("1083");
  });

  it("falls back to the default season key when no season id is present", () => {
    expect(extractSeasonKey("https://www.volleyball-freizeit.de")).toBe(DEFAULT_SEASON_KEY);
    expect(extractSeasonKey(null)).toBe(DEFAULT_SEASON_KEY);
  });
});
