import { AvailabilityStatus, MatchDay } from "../domain/types";
import {mockPlayers} from "./mockPlayers";
import { playerIds } from "./playerIds";

export const mockMatchDays: MatchDay[] = [
  buildMatchDay({
    id: "2026-04-20-esv-freimann",
    title: "ESV Freimann",
    type: "match",
    status: "open",
    date: "2026-04-20",
    time: "20:00",
    opponent: "ESV Freimann",
    homeAway: "home",
    location: "Lowhofer Heimspiel",
    sourceFixtureId: "56",
    overrides: {
      [playerIds.pia]: AvailabilityStatus.Available,
      [playerIds.lars]: AvailabilityStatus.Available,
      [playerIds.nina]: AvailabilityStatus.Available,
      [playerIds.dani]: AvailabilityStatus.Available,
      [playerIds.linda]: AvailabilityStatus.Available,
      [playerIds.volker]: AvailabilityStatus.Available,
      [playerIds.caro]: AvailabilityStatus.Unavailable,
      [playerIds.stefan]: AvailabilityStatus.Unavailable,
      [playerIds.heli]: AvailabilityStatus.Maybe,
      [playerIds.michi]: AvailabilityStatus.Maybe,
      [playerIds.andi]: AvailabilityStatus.Maybe,
    },
  }),
  buildMatchDay({
    id: "2026-04-23-forza-ragazzi",
    title: "Forza Ragazzi",
    type: "match",
    status: "open",
    date: "2026-04-23",
    time: "18:45",
    opponent: "Forza Ragazzi",
    homeAway: "away",
    location: "Forza Ragazzi",
    overrides: {
      [playerIds.pia]: AvailabilityStatus.Available,
      [playerIds.lars]: AvailabilityStatus.Available,
      [playerIds.nina]: AvailabilityStatus.Available,
      [playerIds.dani]: AvailabilityStatus.Available,
      [playerIds.linda]: AvailabilityStatus.Available,
      [playerIds.volker]: AvailabilityStatus.Available,
      [playerIds.andi]: AvailabilityStatus.Available,
      [playerIds.caro]: AvailabilityStatus.Unavailable,
      [playerIds.heli]: AvailabilityStatus.Unavailable,
      [playerIds.stefan]: AvailabilityStatus.Unavailable,
      [playerIds.michi]: AvailabilityStatus.Maybe,
    },
  }),
  buildMatchDay({
    id: "2026-04-13-to-the-top",
    title: "To The Top!",
    type: "match",
    status: "archived",
    date: "2026-04-13",
    time: "20:00",
    opponent: "To The Top!",
    homeAway: "home",
    location: "Lowhofer Heimspiel",
    overrides: {
      [playerIds.pia]: AvailabilityStatus.Available,
      [playerIds.andi]: AvailabilityStatus.Available,
      [playerIds.lars]: AvailabilityStatus.Available,
      [playerIds.volker]: AvailabilityStatus.Available,
      [playerIds.dani]: AvailabilityStatus.Available,
      [playerIds.nina]: AvailabilityStatus.Available,
      [playerIds.michi]: AvailabilityStatus.Available,
      [playerIds.ina]: AvailabilityStatus.Available,
      [playerIds.caro]: AvailabilityStatus.Unavailable,
    },
  }),
  buildMatchDay({
    id: "tbd-loudnproud",
    title: "Loud'n'Proud Terminfindung",
    type: "date-finding",
    status: "open",
    date: "2026-05-01",
    opponent: "Loud'n'Proud",
    homeAway: "home",
    location: "Termin laut Liga noch unbestimmt",
  }),
];

interface BuildMatchDayInput extends Omit<MatchDay, "availability"> {
  overrides?: Partial<Record<string, AvailabilityStatus>>;
}

function buildMatchDay(input: BuildMatchDayInput): MatchDay {
  const availability = mockPlayers.map((player) => {
    return {
      matchDayId: input.id,
      playerId: player.id,
      status: input.overrides?.[player.id] ?? AvailabilityStatus.Unknown,
    };
  });

  return {
    id: input.id,
    title: input.title,
    type: input.type,
    status: input.status,
    date: input.date,
    time: input.time,
    opponent: input.opponent,
    homeAway: input.homeAway,
    location: input.location,
    sourceFixtureId: input.sourceFixtureId,
    availability,
  };
}
