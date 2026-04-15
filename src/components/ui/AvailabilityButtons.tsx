import { FormEvent, useEffect, useState } from "react";
import { AvailabilityStatus } from "../../domain/types";

interface AvailabilityButtonsProps {
  value: AvailabilityStatus;
  comment?: string;
  onChange: (status: AvailabilityStatus, comment?: string | null) => void;
}

const options = [
  { status: AvailabilityStatus.Available, label: "Ja", className: "btn-success" },
  { status: AvailabilityStatus.Maybe, label: "Vielleicht", className: "btn-warning" },
  { status: AvailabilityStatus.Unavailable, label: "Nein", className: "btn-error" },
];

export function AvailabilityButtons({ comment, value, onChange }: AvailabilityButtonsProps) {
  const [draftComment, setDraftComment] = useState(comment ?? "");
  const [isCommentOpen, setIsCommentOpen] = useState(Boolean(comment));

  useEffect(() => {
    setDraftComment(comment ?? "");
    setIsCommentOpen(Boolean(comment));
  }, [comment]);

  function handleSubmitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(value, draftComment.trim() || null);
    setIsCommentOpen(Boolean(draftComment.trim()));
  }

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((option) => {
          const isSelected = value === option.status;

          return (
            <button
              className={`btn h-7 min-h-0 rounded-lg border-0 px-2 py-0 text-xs leading-none ${
                isSelected ? option.className : "bg-base-200 text-base-content hover:bg-base-300"
              }`}
              key={option.status}
              onClick={() =>
                isSelected ? onChange(AvailabilityStatus.Unknown, null) : onChange(option.status, comment ?? null)
              }
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <button
          className="font-semibold text-primary underline-offset-2 hover:underline"
          onClick={() => setIsCommentOpen((current) => !current)}
          type="button"
        >
          {comment ? "Notiz bearbeiten" : "Notiz hinzufügen"}
        </button>
        {comment ? <span className="min-w-0 flex-1 truncate text-base-content/60">„{comment}“</span> : null}
      </div>

      {isCommentOpen ? (
        <form className="flex gap-1.5" onSubmit={handleSubmitComment}>
          <input
            className="input input-bordered h-8 min-h-0 min-w-0 flex-1 rounded-lg px-2 text-xs"
            onChange={(event) => setDraftComment(event.target.value)}
            placeholder="Kurze Notiz"
            value={draftComment}
          />
          <button className="btn h-8 min-h-0 rounded-lg px-2 py-0 text-xs leading-none" type="submit">
            Speichern
          </button>
        </form>
      ) : null}
    </div>
  );
}
