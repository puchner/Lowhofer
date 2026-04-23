import hallAddresses from "../../public/gruppe_4A_hallenadressen_bereinigt_2026-04-23.json";

type HomeAway = "home" | "away" | "unknown";

interface HallAddressEntry {
  team: string;
  club: string | null;
  venue_name: string | null;
  address: string;
  notes: string | null;
}

interface HallAddressFile {
  group: string;
  source_url: string;
  retrieved_at: string;
  teams: HallAddressEntry[];
}

export interface ResolvedVenueDetails {
  address?: string;
  venueName?: string;
  notes?: string;
  mapsUrl: string;
}

const LOWHOFER_TEAM_NAME = "Die lowhofer";

const hallData = hallAddresses as HallAddressFile;

const venueByNormalizedTeamName = new Map(
  hallData.teams.map((entry) => [normalizeTeamName(entry.team), entry] as const),
);

export function resolveVenueDetails(opponent: string, homeAway: HomeAway): ResolvedVenueDetails | null {
  if (homeAway === "home") {
    return null;
  }

  if (homeAway !== "away") {
    return null;
  }

  const venue = venueByNormalizedTeamName.get(normalizeTeamName(opponent));

  if (!venue) {
    return null;
  }

  return {
    address: venue.address,
    mapsUrl: buildMapsUrl(venue.address),
    notes: venue.notes ?? undefined,
    venueName: venue.venue_name ?? undefined,
  };
}

export function normalizeTeamName(teamName: string): string {
  return teamName.trim().toLocaleLowerCase("de-DE").replace(/\s+/g, " ");
}

function buildMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const teamVenueMetadata = {
  group: hallData.group,
  retrievedAt: hallData.retrieved_at,
  teams: hallData.teams.map((entry) => entry.team),
  lowhoferTeamName: LOWHOFER_TEAM_NAME,
};
