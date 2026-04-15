import { SquadAnalysis } from "../../domain/types";

interface TrafficLightProps {
  status: SquadAnalysis["status"];
}

export function TrafficLight({ status }: TrafficLightProps) {
  const label = {
    playable: "Ox ready!",
    critical: "Ox unsteady...",
    "not-playable": "Ox down!",
    "ladies-night": "Ladies Night",
  }[status];

  const classes = {
    playable: "bg-success text-white",
    critical: "bg-warning text-petrol-900",
    "not-playable": "bg-error text-white",
    "ladies-night": "bg-secondary text-petrol-900",
  }[status];

  return <span className={`badge border-0 ${classes}`}>{label}</span>;
}
