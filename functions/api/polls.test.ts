import { describe, expect, it } from "vitest";
import { buildPollDrafts, pollTypeToAppointmentStatus } from "./polls";

describe("buildPollDrafts", () => {
  it("creates a scheduled match draft when exactly one suggestion is provided", () => {
    const drafts = buildPollDrafts(
      {
        title: "TSV Test",
        type: "match",
        opponent: "TSV Test",
        homeAway: "home",
        sourceFixtureId: "35",
        suggestions: [{ date: "2026-05-02", time: "19:30", location: "Halle A" }],
      },
      "player-admin",
    );

    expect(drafts).toHaveLength(1);
    expect(drafts[0].poll_insert.poll_type).toBe("match");
    expect(pollTypeToAppointmentStatus(drafts[0].poll_insert.poll_type)).toBe("scheduled");
    expect(drafts[0].league_fixture_external_id).toBe("35");
  });

  it("creates planned date-finding drafts when multiple suggestions are provided", () => {
    const drafts = buildPollDrafts(
      {
        title: "TSV Test",
        type: "match",
        opponent: "TSV Test",
        homeAway: "away",
        sourceFixtureId: "35",
        suggestions: [
          { date: "2026-05-02", time: "19:30", location: "Halle A" },
          { date: "2026-05-04", time: "20:00", location: "Halle B" },
        ],
      },
      "player-admin",
    );

    expect(drafts).toHaveLength(2);
    expect(drafts.every((draft) => draft.poll_insert.poll_type === "date-finding")).toBe(true);
    expect(drafts.every((draft) => pollTypeToAppointmentStatus(draft.poll_insert.poll_type) === "planned")).toBe(true);
  });

  it("keeps a single added suggestion planned when the request explicitly stays date-finding", () => {
    const drafts = buildPollDrafts(
      {
        title: "TSV Test",
        type: "date-finding",
        opponent: "TSV Test",
        homeAway: "home",
        sourceFixtureId: "35",
        suggestions: [{ date: "2026-05-08", time: "20:00", location: "Halle C" }],
      },
      "player-admin",
    );

    expect(drafts).toHaveLength(1);
    expect(drafts[0].poll_insert.poll_type).toBe("date-finding");
    expect(pollTypeToAppointmentStatus(drafts[0].poll_insert.poll_type)).toBe("planned");
  });
});
