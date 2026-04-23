import { createEmptySuggestionDraft, SuggestionDraft } from "../../domain/pollHelpers";

interface SuggestionEditorProps {
  suggestions: SuggestionDraft[];
  onChange: (suggestions: SuggestionDraft[]) => void;
  heading: string;
  requireDate?: boolean;
  addLabel?: string;
}

export function SuggestionEditor({
  addLabel = "+ Vorschlag",
  heading,
  onChange,
  requireDate = false,
  suggestions,
}: SuggestionEditorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase text-base-content/60">{heading}</p>
      {suggestions.map((suggestion, index) => (
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" key={`${index}-${suggestion.date}-${suggestion.time}`}>
          <input
            className="input input-bordered min-h-11 w-full rounded-lg"
            onChange={(event) =>
              onChange(
                suggestions.map((item, itemIndex) => (itemIndex === index ? { ...item, date: event.target.value } : item)),
              )
            }
            required={requireDate}
            type="date"
            value={suggestion.date}
          />
          <input
            className="input input-bordered min-h-11 w-full rounded-lg"
            onChange={(event) =>
              onChange(
                suggestions.map((item, itemIndex) => (itemIndex === index ? { ...item, time: event.target.value } : item)),
              )
            }
            type="time"
            value={suggestion.time}
          />
          <button
            className="btn min-h-11 rounded-lg"
            disabled={suggestions.length === 1}
            onClick={() => onChange(suggestions.filter((_, itemIndex) => itemIndex !== index))}
            type="button"
          >
            Entfernen
          </button>
        </div>
      ))}
      <button
        className="btn btn-outline min-h-11 rounded-lg"
        onClick={() => onChange([...suggestions, createEmptySuggestionDraft()])}
        type="button"
      >
        {addLabel}
      </button>
    </div>
  );
}
