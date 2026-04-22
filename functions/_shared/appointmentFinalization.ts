import { DbMatchAppointmentRow } from "../../src/data/supabaseMappers";

export interface AppointmentFinalizationPlan {
  winner: DbMatchAppointmentRow;
  siblingsToDelete: DbMatchAppointmentRow[];
}

export function buildAppointmentFinalizationPlan(
  appointments: DbMatchAppointmentRow[],
  currentAppointmentId: string,
): AppointmentFinalizationPlan {
  const winner = appointments.find((appointment) => appointment.id === currentAppointmentId);

  if (!winner) {
    throw new Error("appointment_not_found");
  }

  if (winner.status !== "planned") {
    throw new Error("appointment_not_planned");
  }

  const scheduledAppointment = appointments.find(
    (appointment) => appointment.id !== winner.id && appointment.status === "scheduled",
  );

  if (scheduledAppointment) {
    throw new Error("scheduled_appointment_conflict");
  }

  return {
    winner,
    siblingsToDelete: appointments.filter(
      (appointment) => appointment.id !== winner.id && appointment.status === "planned",
    ),
  };
}
