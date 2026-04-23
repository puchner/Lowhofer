import { describe, expect, it } from "vitest";
import { normalizeTeamName, resolveVenueDetails, teamVenueMetadata } from "./teamVenues";

describe("teamVenues", () => {
  it("matches away opponents against the hall address json", () => {
    const venue = resolveVenueDetails("Loud'n'Proud", "away");

    expect(venue).toEqual({
      address: "Helmholtzstraße 6, München",
      mapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Helmholtzstra%C3%9Fe%206%2C%20M%C3%BCnchen",
      notes: "Eingang an der Marlene-Dietrich-Str.",
      venueName: undefined,
    });
  });

  it("skips venue details for home matches", () => {
    expect(resolveVenueDetails("Blockbusters", "home")).toBeNull();
  });

  it("normalizes team names consistently", () => {
    expect(normalizeTeamName("  FIX   WIE NIX ")).toBe("fix wie nix");
    expect(teamVenueMetadata.teams).toContain("To The Top!");
    expect(teamVenueMetadata.lowhoferTeamName).toBe("Die lowhofer");
  });
});
