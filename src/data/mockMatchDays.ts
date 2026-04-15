import { AvailabilityStatus, MatchDay } from "../domain/types";
import {mockPlayers} from "./mockPlayers";

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
      pia: AvailabilityStatus.Available,
      lars: AvailabilityStatus.Available,
      nina: AvailabilityStatus.Available,
      dani: AvailabilityStatus.Available,
      linda: AvailabilityStatus.Available,
      volker: AvailabilityStatus.Available,
      caro: AvailabilityStatus.Unavailable,
      stefan: AvailabilityStatus.Unavailable,
      heli: AvailabilityStatus.Maybe,
      michi: AvailabilityStatus.Maybe,
      andi: AvailabilityStatus.Maybe,
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
      pia: AvailabilityStatus.Available,
      lars: AvailabilityStatus.Available,
      nina: AvailabilityStatus.Available,
      dani: AvailabilityStatus.Available,
      linda: AvailabilityStatus.Available,
      volker: AvailabilityStatus.Available,
      andi: AvailabilityStatus.Available,
      caro: AvailabilityStatus.Unavailable,
      heli: AvailabilityStatus.Unavailable,
      stefan: AvailabilityStatus.Unavailable,
      michi: AvailabilityStatus.Maybe,
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
      pia: AvailabilityStatus.Available,
      andi: AvailabilityStatus.Available,
      lars: AvailabilityStatus.Available,
      volker: AvailabilityStatus.Available,
      dani: AvailabilityStatus.Available,
      nina: AvailabilityStatus.Available,
      michi: AvailabilityStatus.Available,
      ina: AvailabilityStatus.Available,
      caro: AvailabilityStatus.Unavailable,
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
