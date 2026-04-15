export interface GeneratedAvatarOption {
  style: string;
  seed: string;
  label: string;
}

export interface GeneratedAvatarStyleGroup {
  style: string;
  label: string;
  options: readonly GeneratedAvatarOption[];
}

export const defaultMaleAvatar: GeneratedAvatarOption = {
  label: "Thumbs Felix",
  style: "thumbs",
  seed: "Felix",
};

export const defaultFemaleAvatar: GeneratedAvatarOption = {
  label: "Thumbs Aneka",
  style: "thumbs",
  seed: "Aneka",
};

const thumbsAvatarSeeds = ["Winnie", "Bodo", "Willi", "Felix", "Aneka", "Flo", "Chase", "Bailey"] as const;

const croodlesAvatarSeeds = [
  "Alex",
  "Aneka",
  "Aria",
  "Bailey",
  "Basti",
  "Bodo",
  "Chase",
  "Cleo",
  "Cosmo",
  "Felix",
  "Flo",
  "Franzi",
  "Fritz",
  "Hugo",
  "Jade",
  "Jona",
  "Kira",
  "Lou",
  "Luca",
  "Mika",
  "Milo",
  "Neo",
  "Nova",
  "Olli",
  "Pepe",
  "Robin",
  "Romy",
  "Sina",
  "Theo",
  "Toni",
  "Winnie",
] as const;

const botttsAvatarSeeds = [
  "Bolt",
  "Byte",
  "Chip",
  "Cosmo",
  "Dash",
  "Echo",
  "Flux",
  "Gizmo",
  "Juno",
  "Kito",
  "Nova",
  "Pixel",
  "Quark",
  "Robo",
  "Sprocket",
  "Zippy",
] as const;

const adventurerAvatarSeeds = [
  "Aneka",
  "Bailey",
  "Felix",
  "Flo",
  "Jade",
  "Jona",
  "Kira",
  "Leo",
  "Luna",
  "Mika",
  "Milo",
  "Nova",
  "Olli",
  "Robin",
  "Romy",
  "Sina",
  "Sophie",
  "Theo",
  "Toni",
  "Winnie",
] as const;

const bigEarsAvatarSeeds = [
  "Aneka",
  "Bailey",
  "Basti",
  "Bodo",
  "Chase",
  "Cleo",
  "Felix",
  "Flo",
  "Franzi",
  "Jade",
  "Jona",
  "Kira",
  "Mika",
  "Milo",
  "Robin",
  "Romy",
  "Sina",
  "Theo",
  "Toni",
  "Winnie",
] as const;

const toonHeadAvatarSeeds = [
  "Aneka",
  "Bailey",
  "Bodo",
  "Chase",
  "Cosmo",
  "Felix",
  "Flo",
  "Hugo",
  "Jade",
  "Jona",
  "Kira",
  "Luca",
  "Mika",
  "Milo",
  "Nova",
  "Olli",
  "Robin",
  "Romy",
  "Theo",
  "Winnie",
] as const;

export const generatedAvatarStyleGroups = [
  createAvatarStyleGroup("thumbs", "Thumbs", thumbsAvatarSeeds),
  createAvatarStyleGroup("croodles", "Croodles", croodlesAvatarSeeds),
  createAvatarStyleGroup("bottts", "Bottts", botttsAvatarSeeds),
  createAvatarStyleGroup("adventurer", "Adventurer", adventurerAvatarSeeds),
  createAvatarStyleGroup("big-ears", "Big Ears", bigEarsAvatarSeeds),
  createAvatarStyleGroup("toon-head", "Toon Head", toonHeadAvatarSeeds),
] as const satisfies readonly GeneratedAvatarStyleGroup[];

export const generatedAvatarOptions = generatedAvatarStyleGroups.flatMap((group) => group.options);

export function isGeneratedAvatarOption(value: unknown): value is GeneratedAvatarOption {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GeneratedAvatarOption>;

  return generatedAvatarOptions.some(
    (option) => option.style === candidate.style && option.seed === candidate.seed,
  );
}

function createAvatarStyleGroup(
  style: string,
  label: string,
  seeds: readonly string[],
): GeneratedAvatarStyleGroup {
  return {
    style,
    label,
    options: seeds.map((seed) => ({
      label: `${label} ${seed}`,
      style,
      seed,
    })),
  };
}
