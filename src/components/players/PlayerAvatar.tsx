import { getPlayerAvatar } from "../../domain/avatar";
import { Player } from "../../domain/types";

interface PlayerAvatarProps {
  player: Player;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-14 w-14",
};

export function PlayerAvatar({ className = "", player, size = "md" }: PlayerAvatarProps) {
  const avatar = getPlayerAvatar(player);

  return (
    <img
      alt=""
      className={`${sizeClasses[size]} shrink-0 rounded-full bg-base-100 object-cover ring-1 ring-primary/15 ${className}`}
      loading="lazy"
      src={avatar.url}
    />
  );
}
