import { Player } from "./types";

const collator = new Intl.Collator("de", { sensitivity: "base" });

export function sortPlayersForCurrentUser(players: Player[], selectedPlayerId: string | null): Player[] {
  return [...players].sort((left, right) => {
    if (left.id === selectedPlayerId && right.id !== selectedPlayerId) {
      return -1;
    }

    if (right.id === selectedPlayerId && left.id !== selectedPlayerId) {
      return 1;
    }

    return collator.compare(left.name, right.name);
  });
}
