import { describe, expect, it } from "vitest";
import {
  buildCreatePollInputForFixture,
  buildCreatePollInputForMatchDay,
  resolvePollTypeForSuggestions,
  shouldConvertCurrentPollToSuggestion,
} from "./pollHelpers";

describe("resolvePollTypeForSuggestions", () => {
  it("uses match by default for a single suggestion", () => {
    expect(resolvePollTypeForSuggestions(1)).toBe("match");
  });

  it("keeps a single suggestion in date-finding mode when requested", () => {
    expect(resolvePollTypeForSuggestions(1, "date-finding")).toBe("date-finding");
  });

  it("always uses date-finding for multiple suggestions", () => {
    expect(resolvePollTypeForSuggestions(2, "match")).toBe("date-finding");
    expect(resolvePollTypeForSuggestions(2, "date-finding")).toBe("date-finding");
  });
});

describe("buildCreatePollInputForFixture", () => {
  it("keeps a single suggestion in date-finding mode when requested", () => {
    const input = buildCreatePollInputForFixture(
      {
        id: "35",
        opponent: "TSV Test",
        homeAway: "home",
      },
      [{ date: "2026-05-08", time: "20:00" }],
      "date-finding",
    );

    expect(input.type).toBe("date-finding");
    expect(input.suggestions).toEqual([{ date: "2026-05-08", time: "20:00" }]);
    expect(input.date).toBeUndefined();
    expect(input.time).toBeUndefined();
  });
});

describe("buildCreatePollInputForMatchDay", () => {
  it("creates a fixed match when editing leaves exactly one new suggestion", () => {
    const input = buildCreatePollInputForMatchDay(
      {
        title: "TSV Test",
        opponent: "TSV Test",
        homeAway: "home",
        sourceFixtureId: "35",
      },
      [{ date: "2026-05-08", time: "20:00" }],
    );

    expect(input.type).toBe("match");
    expect(input.date).toBe("2026-05-08");
    expect(input.time).toBe("20:00");
    expect(input.suggestions).toBeUndefined();
  });
});

describe("shouldConvertCurrentPollToSuggestion", () => {
  it("converts a kept single scheduled poll when editing creates multiple suggestions", () => {
    expect(
      shouldConvertCurrentPollToSuggestion(
        {
          id: "poll-1",
          type: "match",
          appointmentStatus: "scheduled",
        },
        ["poll-1"],
        2,
      ),
    ).toBe(true);
  });

  it("does not convert an already planned suggestion poll", () => {
    expect(
      shouldConvertCurrentPollToSuggestion(
        {
          id: "poll-1",
          type: "date-finding",
          appointmentStatus: "planned",
        },
        ["poll-1"],
        2,
      ),
    ).toBe(false);
  });
});
