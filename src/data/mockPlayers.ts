import { Gender, Player, Position } from "../domain/types";
import { playerIds } from "./playerIds";

// TODO: Diese Datei mit echten Lowhofer-Spielerdaten ersetzen, sobald Auth und Supabase stehen.
export const mockPlayers: Player[] = [
  {
    id: playerIds.pia,
    name: "Pia",
    gender: Gender.Female,
    positions: [Position.Middle, Position.Opposite],
    primaryPosition: Position.Middle,
  },
  {
    id: playerIds.nina,
    name: "Nina",
    gender: Gender.Female,
    positions: [Position.Outside, Position.Opposite],
    primaryPosition: Position.Opposite,
  },
  {
    id: playerIds.dani,
    name: "Dani",
    gender: Gender.Female,
    positions: [Position.Setter],
    primaryPosition: Position.Setter,
  },
  {
    id: playerIds.caro,
    name: "Caro",
    gender: Gender.Female,
    positions: [Position.Outside, Position.Opposite],
    primaryPosition: Position.Opposite,
  },
  {
    id: playerIds.linda,
    name: "Linda",
    gender: Gender.Female,
    positions: [Position.Libero, Position.Setter],
    primaryPosition: Position.Setter,
  },
  {
    id: playerIds.ina,
    name: "Ina",
    gender: Gender.Female,
    positions: [Position.Libero],
    primaryPosition: Position.Libero,
  },
  {
    id: playerIds.andi,
    name: "Andi",
    gender: Gender.Male,
    positions: [Position.Middle, Position.Setter, Position.Outside, Position.Opposite],
    primaryPosition: Position.Outside,
  },
  {
    id: playerIds.lars,
    name: "Lars",
    gender: Gender.Male,
    positions: [Position.Outside, Position.Opposite],
    primaryPosition: Position.Outside,
  },
  {
    id: playerIds.stefan,
    name: "Stefan",
    gender: Gender.Male,
    positions: [Position.Middle, Position.Outside],
    primaryPosition: Position.Outside,
  },
  {
    id: playerIds.volker,
    name: "Volker",
    gender: Gender.Male,
    positions: [Position.Middle],
    primaryPosition: Position.Middle,
  },
  {
    id: playerIds.michi,
    name: "Michi",
    gender: Gender.Male,
    positions: [Position.Outside, Position.Middle],
    primaryPosition: Position.Middle,
  },
  {
    id: playerIds.fran,
    name: "Fran",
    gender: Gender.Male,
    positions: [Position.Middle],
    primaryPosition: Position.Middle,
  },
  {
    id: playerIds.heli,
    name: "Heli",
    gender: Gender.Male,
    positions: [Position.Middle],
    primaryPosition: Position.Middle,
  },
];
