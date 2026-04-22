import { describe, expect, it } from "vitest";
import { buildAppointmentFinalizationPlan } from "./appointmentFinalization";
import { DbMatchAppointmentRow } from "../../src/data/supabaseMappers";

describe("buildAppointmentFinalizationPlan", () => {
  it("keeps the selected planned appointment and marks other planned siblings for deletion", () => {
    const plan = buildAppointmentFinalizationPlan(
      [
        appointmentRow({ id: "winner", status: "planned" }),
        appointmentRow({ id: "other-planned", status: "planned" }),
        appointmentRow({ id: "cancelled", status: "cancelled" }),
      ],
      "winner",
    );

    expect(plan.winner.id).toBe("winner");
    expect(plan.siblingsToDelete.map((appointment) => appointment.id)).toEqual(["other-planned"]);
  });

  it("rejects finalization when another scheduled appointment already exists", () => {
    expect(() =>
      buildAppointmentFinalizationPlan(
        [
          appointmentRow({ id: "winner", status: "planned" }),
          appointmentRow({ id: "scheduled", status: "scheduled" }),
        ],
        "winner",
      ),
    ).toThrowError("scheduled_appointment_conflict");
  });

  it("rejects finalization for non-planned appointments", () => {
    expect(() =>
      buildAppointmentFinalizationPlan([appointmentRow({ id: "cancelled", status: "cancelled" })], "cancelled"),
    ).toThrowError("appointment_not_planned");
  });
});

function appointmentRow(overrides: Partial<DbMatchAppointmentRow> = {}): DbMatchAppointmentRow {
  return {
    id: "appointment-1",
    match_id: "match-1",
    starts_at: "2026-05-01T18:00:00.000Z",
    has_time: true,
    status: "planned",
    location: "Lowhofer",
    source_type: "custom",
    cancelled_at: null,
    cancellation_reason: null,
    created_at: "2026-04-20T10:00:00.000Z",
    updated_at: "2026-04-20T10:00:00.000Z",
    ...overrides,
  };
}
