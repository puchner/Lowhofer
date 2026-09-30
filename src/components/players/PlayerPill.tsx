import { Player } from "../../domain/types";
import { PlayerAvatar } from "./PlayerAvatar";
import { TemporaryUnavailableStatus } from "./TemporaryUnavailableStatus";

interface PlayerPillProps {
  player: Player;
  comment?: string;
  isCurrentPlayer?: boolean;
}

export function PlayerPill({ comment, isCurrentPlayer = false, player }: PlayerPillProps) {
  if (comment?.trim()) {
    return (
      <div className={`flex min-h-10 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-2 py-1.5 text-sm ${player.tempUnavailableReason ? "border-neutral/20 bg-neutral/10" : "border-transparent bg-base-200"}`}>
        <PlayerAvatar player={player} size="sm" />
        <span className={`font-bold ${player.tempUnavailableReason ? "text-base-content/60" : "text-petrol-900"}`}>
          {player.name}
          {isCurrentPlayer ? " · Du" : ""}
        </span>
        <span className="italic text-base-content/70">{comment}</span>
        {player.tempUnavailableReason ? <TemporaryUnavailableStatus note={player.tempUnavailableNote} reason={player.tempUnavailableReason} /> : null}
      </div>
    );
  }

  return (
    <div className={`flex min-h-8 flex-wrap items-center gap-2 rounded-lg border px-2 py-1 text-sm font-semibold ${player.tempUnavailableReason ? "border-neutral/20 bg-neutral/10 text-base-content/60" : "border-transparent bg-base-200 text-petrol-900"}`}>
      <PlayerAvatar player={player} size="sm" />
      <span>
        {player.name}
        {isCurrentPlayer ? " · Du" : ""}
      </span>
      {player.tempUnavailableReason ? <TemporaryUnavailableStatus note={player.tempUnavailableNote} reason={player.tempUnavailableReason} /> : null}
    </div>
  );
}
