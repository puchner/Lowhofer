import { describe, expect, it } from "vitest";
import {
  canEditOwnProfile,
  canGrantAdminRights,
  canManageLeagueSource,
  canManageMatches,
  canRespondToMatch,
  isAdmin,
} from "./permissions";

describe("permissions", () => {
  it("allows a normal player to respond and edit their own profile", () => {
    const user = { isAdmin: false, role: "member" as const };

    expect(canRespondToMatch(user)).toBe(true);
    expect(canEditOwnProfile(user)).toBe(true);
  });

  it("does not allow the shared Lowhofer account to respond or edit a profile", () => {
    const user = { isAdmin: false, role: "training_member" as const };

    expect(canRespondToMatch(user)).toBe(false);
    expect(canEditOwnProfile(user)).toBe(false);
  });

  it("requires an admin to also be a real player", () => {
    const sharedAdmin = { isAdmin: true, role: "training_member" as const };

    expect(isAdmin(sharedAdmin)).toBe(false);
    expect(canManageMatches(sharedAdmin)).toBe(false);
    expect(canManageLeagueSource(sharedAdmin)).toBe(false);
    expect(canGrantAdminRights(sharedAdmin)).toBe(false);
  });

  it("allows admin-player actions for admin team members", () => {
    const adminPlayer = { isAdmin: true, role: "member" as const };

    expect(canManageMatches(adminPlayer)).toBe(true);
    expect(canManageLeagueSource(adminPlayer)).toBe(true);
  });
});
