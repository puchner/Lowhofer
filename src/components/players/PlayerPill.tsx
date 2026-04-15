import { Player } from "../../domain/types";
import { PlayerAvatar } from "./PlayerAvatar";

interface PlayerPillProps {
  player: Player;
  comment?: string;
  isCurrentPlayer?: boolean;
}

export function PlayerPill({ comment, isCurrentPlayer = false, player }: PlayerPillProps) {
  if (comment?.trim()) {
    return (
      <div className="flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-base-200 px-2 py-1.5 text-sm">
        <PlayerAvatar player={player} size="sm" />
        <span className="font-bold text-petrol-900">
          {player.name}
          {isCurrentPlayer ? " · Du" : ""}
        </span>
        <span className="italic text-base-content/70">{comment}</span>
      </div>
    );
  }

  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-base-200 py-1 pl-1 pr-2 text-sm font-semibold text-petrol-900">
      <PlayerAvatar player={player} size="sm" />
      <span>
        {player.name}
        {isCurrentPlayer ? " · Du" : ""}
      </span>
    </span>
  );
}
