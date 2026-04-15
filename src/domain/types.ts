export enum Position {
  Setter = "Zuspiel",
  Outside = "Außenangriff",
  Middle = "Mittelblock",
  Opposite = "Diagonal",
  Libero = "Libero",
}

export enum Gender {
  Female = "female",
  Male = "male",
  Diverse = "diverse",
}

export enum AvailabilityStatus {
  Available = "zugesagt",
  Unavailable = "abgesagt",
  Maybe = "unsicher",
  Unknown = "keine Rückmeldung",
}

export interface Player {
  id: string;
  name: string;
  gender: Gender;
  positions: Position[];
  primaryPosition?: Position;
  notes?: string;
}

export interface MatchAvailability {
  matchDayId: string;
  playerId: string;
  status: AvailabilityStatus;
  comment?: string;
}

export type PollType = "match" | "date-finding";
export type PollStatus = "open" | "archived" | "cancelled";

export interface LeagueFixture {
  id: string;
  date?: string;
  time?: string;
  opponent: string;
  homeAway: "home" | "away" | "unknown";
  state: "new" | "verified" | "unverified";
  source: "league";
}

export interface AvailabilityPoll {
  id: string;
  title: string;
  type: PollType;
  status: PollStatus;
  date: string;
  time?: string;
  opponent: string;
  homeAway: "home" | "away" | "unknown";
  location?: string;
  sourceFixtureId?: string;
  availability: MatchAvailability[];
}

export type MatchDay = AvailabilityPoll;

export interface CoverageResult {
  position: Position;
  required: number;
  availablePlayers: Player[];
  candidates: Player[];
  isCovered: boolean;
  isCritical: boolean;
}

export interface RuleCheckResult {
  rule: string;
  passed: boolean;
  severity: "ok" | "warning" | "error";
  message: string;
}

export interface LineupSlot {
  role: Position;
  player: Player;
}

export interface SquadAnalysis {
  matchDayId: string;
  availableCount: number;
  maybeCount: number;
  coveredPositions: Position[];
  missingPositions: Position[];
  criticalPositions: CoverageResult[];
  coverage: CoverageResult[];
  minimumPlayersCheck: RuleCheckResult;
  mixedRuleCheck: RuleCheckResult;
  possibleLineup: LineupSlot[] | null;
  flexiblePlayers: Player[];
  warnings: string[];
  status: "playable" | "critical" | "not-playable" | "ladies-night";
}
