import { RuleCheckResult } from "../../domain/types";

interface RuleCardProps {
  title: string;
  value: string;
  result?: RuleCheckResult;
}

export function RuleCard({ title, value, result }: RuleCardProps) {
  const statusClass =
    result?.severity === "error"
      ? "border-error/40 bg-error/10"
      : result?.severity === "warning"
        ? "border-warning/40 bg-warning/10"
        : "border-primary/20 bg-base-100";

  return (
    <article className={`rounded-lg border p-4 shadow-sm ${statusClass}`}>
      <p className="text-sm text-base-content/70">{title}</p>
      <p className="mt-2 text-2xl font-bold text-petrol-900">{value}</p>
      {result ? <p className="mt-2 text-sm text-base-content/70">{result.message}</p> : null}
    </article>
  );
}
