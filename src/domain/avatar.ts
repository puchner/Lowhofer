import { Player, PlayerAvatar } from "./types";
import { defaultFemaleAvatar, defaultMaleAvatar } from "./avatarOptions";
import { Gender } from "./types";

const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x";

export function getPlayerAvatar(player: Player): PlayerAvatar {
  if (player.avatar?.kind === "generated" && player.avatar.style && player.avatar.seed) {
    return {
      ...player.avatar,
      url: getGeneratedAvatarUrl(player.avatar.style, player.avatar.seed),
    };
  }

  if (player.avatar?.kind === "uploaded" && player.avatar.url) {
    return player.avatar;
  }

  const defaultAvatar = getDefaultAvatarForGender(player.gender);

  return {
    kind: "generated",
    style: defaultAvatar.style,
    seed: defaultAvatar.seed,
    url: getGeneratedAvatarUrl(defaultAvatar.style, defaultAvatar.seed),
  };
}

export function getGeneratedAvatarUrl(style: string, seed: string): string {
  const url = new URL(`${DICEBEAR_BASE_URL}/${encodeURIComponent(style)}/svg`);
  url.searchParams.set("seed", seed);

  return url.toString();
}

function getDefaultAvatarForGender(gender: Player["gender"]) {
  if (gender === Gender.Male) {
    return defaultMaleAvatar;
  }

  return defaultFemaleAvatar;
}
