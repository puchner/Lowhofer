import { AvailabilityStatus } from "../../domain/types";

interface AvailabilityButtonsProps {
  value: AvailabilityStatus;
  onChange: (status: AvailabilityStatus) => void;
}

const options = [
  { status: AvailabilityStatus.Available, label: "Ja", className: "btn-success" },
  { status: AvailabilityStatus.Maybe, label: "Vielleicht", className: "btn-warning" },
  { status: AvailabilityStatus.Unavailable, label: "Nein", className: "btn-error" },
];

export function AvailabilityButtons({ value, onChange }: AvailabilityButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const isSelected = value === option.status;

        return (
          <button
            className={`btn min-h-12 rounded-lg border-0 px-2 text-sm ${
              isSelected ? option.className : "bg-base-200 text-base-content hover:bg-base-300"
            }`}
            key={option.status}
            onClick={() => onChange(option.status)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
