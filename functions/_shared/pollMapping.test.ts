import { describe, expect, it } from "vitest";
import {
  DbAvailabilityPollWithAppointmentRow,
  DbAvailabilityResponseRow,
  DbMatchAppointmentWithMatchRow,
  DbMatchRow,
} from "../../src/data/supabaseMappers";
import { mapPollWithAppointment } from "./pollMapping";

describe("mapPollWithAppointment", () => {
  it("maps poll, appointment and match data into the API shape", () => {
    const poll = pollRow({
      match_appointments: appointmentRow({
        starts_at: "2026-05-10T16:30:00.000Z",
        location: "Neue Halle",
        matches: matchRow({
          league_game_nr: "77",
          opponent_name: "TSV Neubiberg",
          home_away: "away",
        }),
      }),
    });
    const responses = [
      responseRow({ player_id: "player-1", poll_id: poll.id, status: "available" }),
      responseRow({ player_id: "player-2", poll_id: poll.id, status: "maybe", comment: "komme spaeter" }),
      responseRow({ player_id: "other-player", poll_id: "other-poll", status: "unavailable" }),
    ];

    expect(mapPollWithAppointment(poll, responses)).toEqual({
      id: "poll-1",
      matchId: "match-1",
      appointmentId: "appointment-1",
      appointmentStatus: "scheduled",
      title: "Poll Titel",
      type: "match",
      status: "open",
      date: "2026-05-10",
      time: "18:30",
      opponent: "TSV Neubiberg",
      homeAway: "away",
      location: "Neue Halle",
      sourceFixtureId: "77",
      leagueGameNr: "77",
      availability: [
        {
          matchDayId: "poll-1",
          playerId: "player-1",
          status: "zugesagt",
          comment: undefined,
        },
        {
          matchDayId: "poll-1",
          playerId: "player-2",
          status: "unsicher",
          comment: "komme spaeter",
        },
      ],
    });
  });

  it("uses appointment data and degrades gracefully when the match is missing", () => {
    const poll = pollRow({
      match_appointments: appointmentRow({
        starts_at: "2026-05-01T16:45:00.000Z",
        location: "Zwischenhalle",
        matches: null,
      }),
    });

    expect(mapPollWithAppointment(poll, [])).toMatchObject({
      matchId: undefined,
      appointmentId: "appointment-1",
      appointmentStatus: "scheduled",
      date: "2026-05-01",
      time: "18:45",
      opponent: "",
      homeAway: "unknown",
      location: "Zwischenhalle",
      sourceFixtureId: undefined,
      leagueGameNr: undefined,
      availability: [],
    });
  });

  it("returns empty appointment-derived fields when no appointment is linked", () => {
    const poll = pollRow({
      match_appointments: null,
    });

    expect(mapPollWithAppointment(poll, [])).toMatchObject({
      matchId: undefined,
      appointmentId: "appointment-1",
      appointmentStatus: undefined,
      date: "",
      time: undefined,
      opponent: "",
      homeAway: "unknown",
      location: undefined,
      sourceFixtureId: undefined,
      leagueGameNr: undefined,
      availability: [],
    });
  });
});

function pollRow(overrides: Partial<DbAvailabilityPollWithAppointmentRow> = {}): DbAvailabilityPollWithAppointmentRow {
  return {
    id: "poll-1",
    title: "Poll Titel",
    poll_type: "match",
    poll_status: "open",
    notes: null,
    match_appointment_id: "appointment-1",
    created_by_player_id: "player-admin",
    archived_at: null,
    created_at: "2026-04-01T10:00:00.000Z",
    updated_at: "2026-04-01T10:00:00.000Z",
    match_appointments: null,
    ...overrides,
  };
}

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
    created_at: "2026-04-01T10:00:00.000Z",
    updated_at: "2026-04-01T10:00:00.000Z",
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
    home_away: "away",
    notes: null,
    created_at: "2026-04-01T10:00:00.000Z",
    updated_at: "2026-04-01T10:00:00.000Z",
    ...overrides,
  };
}

function responseRow(overrides: Partial<DbAvailabilityResponseRow> = {}): DbAvailabilityResponseRow {
  return {
    id: "response-1",
    poll_id: "poll-1",
    player_id: "player-1",
    status: "available",
    comment: null,
    updated_at: "2026-04-01T10:00:00.000Z",
    ...overrides,
  };
}
