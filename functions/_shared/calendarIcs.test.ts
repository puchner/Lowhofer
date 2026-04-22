import { describe, expect, it } from "vitest";
import { DbMatchAppointmentWithMatchRow, DbMatchRow } from "../../src/data/supabaseMappers";
import { buildCalendarIcs, escapeText } from "./calendarIcs";

describe("buildCalendarIcs", () => {
  it("exports scheduled appointments with stable uid, summary, time and location", () => {
    const ics = buildCalendarIcs(
      [
        {
          appointment: appointmentRow({
            id: "appointment-1",
            starts_at: "2026-05-10T16:30:00.000Z",
            location: "Neue Halle, Feld 1",
            matches: matchRow({
              opponent_name: "TSV Neubiberg",
              home_away: "away",
            }),
          }),
          participants: ["Pia", "Volker"],
        },
      ],
      new Date("2026-04-20T10:15:30.000Z"),
    );

    expect(ics).toContain("BEGIN:VCALENDAR\r\n");
    expect(ics).toContain("UID:appointment-1@lowhofer-calendar\r\n");
    expect(ics).toContain("DTSTAMP:20260420T101530Z\r\n");
    expect(ics).toContain("SUMMARY:TSV Neubiberg vs Lowhofer\r\n");
    expect(ics).toContain("DTSTART:20260510T163000Z\r\n");
    expect(ics).toContain("DTEND:20260510T183000Z\r\n");
    expect(ics).toContain("LOCATION:Neue Halle\\, Feld 1\r\n");
    expect(ics).toContain("DESCRIPTION:Zusagen: Pia\\, Volker\r\n");
  });

  it("does not export planned or cancelled appointments in the MVP feed", () => {
    const ics = buildCalendarIcs([
      { appointment: appointmentRow({ id: "scheduled", status: "scheduled" }), participants: [] },
      { appointment: appointmentRow({ id: "planned", status: "planned" }), participants: [] },
      { appointment: appointmentRow({ id: "cancelled", status: "cancelled" }), participants: [] },
    ]);

    expect(ics).toContain("UID:scheduled@lowhofer-calendar");
    expect(ics).not.toContain("UID:planned@lowhofer-calendar");
    expect(ics).not.toContain("UID:cancelled@lowhofer-calendar");
  });

  it("exports appointments without a time as all-day events", () => {
    const ics = buildCalendarIcs([
      {
        appointment: appointmentRow({
          has_time: false,
          starts_at: "2026-05-01T00:00:00.000Z",
        }),
        participants: [],
      },
    ]);

    expect(ics).toContain("DTSTART;VALUE=DATE:20260501\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20260502\r\n");
  });
});

describe("escapeText", () => {
  it("escapes ICS text separators and line breaks", () => {
    expect(escapeText("Halle, Feld 1; Reihe A\\B\nNotiz")).toBe("Halle\\, Feld 1\\; Reihe A\\\\B\\nNotiz");
  });
});

function appointmentRow(
  overrides: Partial<DbMatchAppointmentWithMatchRow> = {},
): DbMatchAppointmentWithMatchRow {
  return {
    id: "appointment-1",
    match_id: "match-1",
    starts_at: "2026-05-10T16:30:00.000Z",
    has_time: true,
    status: "scheduled",
    location: "Neue Halle",
    source_type: "league",
    cancelled_at: null,
    cancellation_reason: null,
    created_at: "2026-04-20T10:00:00.000Z",
    updated_at: "2026-04-20T10:00:00.000Z",
    matches: matchRow(),
    ...overrides,
  };
}

function matchRow(overrides: Partial<DbMatchRow> = {}): DbMatchRow {
  return {
    id: "match-1",
    source_type: "league",
    league_game_nr: "77",
    season_key: "1083",
    team_key: "lowhofer",
    opponent_name: "TSV Neubiberg",
    home_away: "home",
    notes: null,
    created_at: "2026-04-20T10:00:00.000Z",
    updated_at: "2026-04-20T10:00:00.000Z",
    ...overrides,
  };
}
